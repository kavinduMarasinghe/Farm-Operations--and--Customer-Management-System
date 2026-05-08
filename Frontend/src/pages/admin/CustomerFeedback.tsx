import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Star, Reply, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import whatsappIcon from "@/assets/whats app icon.png";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FeedbackType {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  subject: string;
  description: string;
  rating: number;
  category: string;
  date: string;
}

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [sendMethod, setSendMethod] = useState<'direct' | 'url'>('direct');
  const { toast } = useToast();

  // Backend API URL
  const API_URL = "http://localhost:8070"; // adjust if your backend port is different

  // Fetch feedbacks and WhatsApp status from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch feedbacks
        const feedbackResponse = await axios.get(`${API_URL}/api/cusFeedbacks`);
        console.log("Feedback data:", feedbackResponse.data);
        setFeedbacks(feedbackResponse.data);

        // Fetch WhatsApp service status
        const statusResponse = await axios.get(`${API_URL}/api/cusFeedbacks/whatsapp/status`);
        setWhatsappStatus(statusResponse.data.whatsappService);
        
        // Set default send method based on configuration
        if (statusResponse.data.whatsappService.configured) {
          setSendMethod('direct');
        } else {
          setSendMethod('url');
        }
        
      } catch (error) {
        console.error("Error fetching data", error);
        // Fallback to URL method if status check fails
        setSendMethod('url');
      }
    };
    fetchData();
  }, []);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !selectedFeedback) {
      toast({
        title: "Error",
        description: "Please enter a reply message.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFeedback.phone) {
      toast({
        title: "Error",
        description: "Customer phone number not available for WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReply(true);
    try {
      // Send WhatsApp reply via backend API
      const response = await axios.post(`${API_URL}/api/cusFeedbacks/${selectedFeedback._id}/whatsapp-reply`, {
        replyMessage: replyMessage,
        sendMethod: sendMethod
      });

      if (response.data.success) {
        if (response.data.method === 'twilio_api') {
          // Message sent directly via Twilio
          toast({
            title: "Message Sent Successfully! 🎉",
            description: `WhatsApp message sent directly to ${selectedFeedback.name} via Twilio API.`,
          });
        } else if (response.data.whatsappUrl) {
          // Open WhatsApp with the pre-filled message
          window.open(response.data.whatsappUrl, '_blank');
          
          const method = response.data.method === 'url_fallback' ? 'Twilio failed, opened WhatsApp' : 'WhatsApp opened';
          toast({
            title: `${method} 📱`,
            description: `WhatsApp opened with reply to ${selectedFeedback.name}. Please send the message.`,
          });
        }
        
        setReplyMessage("");
        setIsReplyDialogOpen(false);
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
      
    } catch (error) {
      console.error("WhatsApp reply error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send WhatsApp reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getRatingStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}</span>
    </div>
  );

  // Helper to truncate description in table
  const truncateText = (text: string, maxLength: number) => 
    text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

  // Generate PDF Report
  const generatePDFReport = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('FarmerHub - Customer Feedback Report', 20, 20);
      
      // Subtitle with date
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Feedback Entries: ${feedbacks.length}`, 20, 38);
      
      // Summary Statistics
      const avgRating = feedbacks.length > 0 
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : '0';
      
      const ratingDistribution = {
        5: feedbacks.filter(f => f.rating === 5).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        1: feedbacks.filter(f => f.rating === 1).length,
      };

      const categoryDistribution = feedbacks.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Statistics', 20, 50);
      
      doc.setFontSize(10);
      doc.text(`Average Rating: ${avgRating}/5`, 20, 60);
      doc.text(`5 Stars: ${ratingDistribution[5]} | 4 Stars: ${ratingDistribution[4]} | 3 Stars: ${ratingDistribution[3]} | 2 Stars: ${ratingDistribution[2]} | 1 Star: ${ratingDistribution[1]}`, 20, 68);
      
      // Category breakdown
      let yPos = 76;
      doc.text('Feedback by Category:', 20, yPos);
      Object.entries(categoryDistribution).forEach(([category, count]) => {
        yPos += 8;
        doc.text(`${category}: ${count} feedback(s)`, 30, yPos);
      });

      // Prepare table data
      const tableData = feedbacks.map(feedback => [
        feedback.name,
        feedback.phone || 'N/A',
        feedback.subject,
        feedback.category,
        feedback.description.length > 80 ? feedback.description.substring(0, 80) + '...' : feedback.description,
        `${feedback.rating}/5`,
        new Date(feedback.date).toLocaleDateString()
      ]);

      // Create table
      autoTable(doc, {
        head: [['Name', 'Phone', 'Subject', 'Category', 'Description', 'Rating', 'Date']],
        body: tableData,
        startY: yPos + 15,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          4: { cellWidth: 40 }, // Description column
        },
        margin: { left: 20, right: 20 },
        didDrawPage: function (data) {
          // Add page number
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
        }
      });

      // Add detailed feedback section if there are few entries
      if (feedbacks.length <= 5 && feedbacks.length > 0) {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Detailed Feedback', 20, 20);
        
        let detailY = 35;
        feedbacks.forEach((feedback, index) => {
          if (detailY > 250) {
            doc.addPage();
            detailY = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(60, 60, 60);
          doc.text(`${index + 1}. ${feedback.name} (${feedback.rating}/5 stars)`, 20, detailY);
          
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`Subject: ${feedback.subject}`, 25, detailY + 8);
          doc.text(`Category: ${feedback.category}`, 25, detailY + 16);
          doc.text(`Phone: ${feedback.phone || 'Not provided'}`, 25, detailY + 24);
          doc.text(`Date: ${new Date(feedback.date).toLocaleDateString()}`, 25, detailY + 32);
          
          // Split long descriptions
          const descriptionLines = doc.splitTextToSize(feedback.description, 160);
          doc.text('Description:', 25, detailY + 40);
          doc.text(descriptionLines, 25, detailY + 48);
          
          detailY += 48 + (descriptionLines.length * 4) + 15;
        });
      }

      // Save the PDF
      const fileName = `FarmerHub_Feedback_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Generated Successfully! 📄",
        description: `Report saved as ${fileName}`,
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Feedback</h1>
          <p className="text-muted-foreground">Monitor customer feedback submissions</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* PDF Report Button */}
          <Button
            onClick={generatePDFReport}
            disabled={feedbacks.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <FileText className="h-4 w-4" />
            Generate PDF Report
          </Button>
          
          {/* WhatsApp Status Indicator */}
          {whatsappStatus && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
              <img src={whatsappIcon} alt="WhatsApp" className="h-6 w-6" />
              <span>
                WhatsApp: <span className={whatsappStatus.configured ? 'text-green-600 font-medium' : 'text-orange-500'}>
                  {whatsappStatus.configured ? 'API Ready' : 'URL Mode'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Table */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Feedback ({feedbacks.length})
            </CardTitle>
            {feedbacks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={generatePDFReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.phone || 'N/A'}</TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell title={item.description}>
                      {truncateText(item.description, 50)}
                    </TableCell>
                    <TableCell>{getRatingStars(item.rating)}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-3">
                        <img
                          src={whatsappIcon}
                          alt="WhatsApp"
                          className={`h-8 w-8 cursor-pointer transition-opacity ${
                            item.phone ? 'hover:opacity-80' : 'opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (item.phone) {
                              setSelectedFeedback(item);
                              setIsReplyDialogOpen(true);
                            }
                          }}
                          title={item.phone ? "Reply via WhatsApp" : "Phone number not available"}
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(item);
                            setIsViewDialogOpen(true);
                          }}
                          className="min-w-[48px]"
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {feedbacks.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No feedback found
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Feedback Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>View Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Name</label>
                <Input value={selectedFeedback.name} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                <Input value={selectedFeedback.phone || 'Not provided'} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Subject</label>
                <Input value={selectedFeedback.subject} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Category</label>
                <Input value={selectedFeedback.category} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Description</label>
                <textarea
                  value={selectedFeedback.description}
                  readOnly
                  className="w-full border border-border rounded p-2 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Rating</label>
                {getRatingStars(selectedFeedback.rating)}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Date</label>
                <Input value={new Date(selectedFeedback.date).toLocaleDateString()} readOnly />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={whatsappIcon} alt="WhatsApp" className="h-7 w-7" />
              WhatsApp Reply to Customer
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Customer Details
                </label>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded space-y-1">
                  <div><strong>Name:</strong> {selectedFeedback.name}</div>
                  <div><strong>Phone:</strong> {selectedFeedback.phone}</div>
                  <div><strong>Subject:</strong> {selectedFeedback.subject}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Your Reply Message
                </label>
                <Textarea
                  placeholder="Enter your reply message for WhatsApp. This will be sent with FarmerHub header..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 This will open WhatsApp with a pre-formatted message including FarmerHub branding
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsReplyDialogOpen(false);
                    setReplyMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReplySubmit}
                  disabled={isSubmittingReply || !replyMessage.trim()}
                  className="flex items-center gap-2"
                >
                  {isSubmittingReply ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opening WhatsApp...
                    </>
                  ) : (
                    <>
                      <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
                      Open WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerFeedback;
