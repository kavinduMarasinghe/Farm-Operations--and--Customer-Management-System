import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  Users,
  Package,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

// 🔹 export features
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Reports = () => {
  // reportType is fixed to 'orders' — dropdown removed per request
  const [reportType] = useState("orders");
  const [timeRange, setTimeRange] = useState("month");
  const [orderReport, setOrderReport] = useState<any>(null);
  const [cottageReport, setCottageReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch report (orders only)
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8070/api/reports/orders?range=${timeRange}`
      );
      setOrderReport(res.data.data);
    } catch (err) {
      console.error("Error loading order report:", err);
      // 🔹 Fallback to mock data when API is not available
      setOrderReport({
        totalOrders: 156,
        totalRevenue: 45250,
        paymentSummary: [
          { _id: "paid", count: 134 },
          { _id: "pending", count: 15 },
          { _id: "failed", count: 7 }
        ],
        statusSummary: [
          { _id: "delivered", count: 120 },
          { _id: "pending", count: 25 },
          { _id: "cancelled", count: 11 }
        ],
        allOrders: [
          {
            date: "2024-10-08",
            customerInfo: { name: "John Doe" },
            total: 1250,
            paymentStatus: "paid",
            status: "delivered"
          },
          {
            date: "2024-10-07",
            customerInfo: { name: "Jane Smith" },
            total: 875,
            paymentStatus: "paid",
            status: "delivered"
          },
          {
            date: "2024-10-06",
            customerInfo: { name: "Bob Johnson" },
            total: 2100,
            paymentStatus: "pending",
            status: "pending"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, timeRange]);

  // 🔹 Export PDF with all categorized data
const exportPDF = async () => {
  const input = document.getElementById("report-content");
  if (!input) return;

  const pdf = new jsPDF("p", "mm", "a4");

  // First capture current UI
  const canvas = await html2canvas(input, { 
    allowTaint: true,
    useCORS: true,
    height: input.scrollHeight,
    width: input.scrollWidth
  });
  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // 🔹 Append full categorized data
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text(
    reportType === "orders" ? "All Orders (Categorized)" : "All Cottage Bookings (Categorized)",
    10,
    20
  );
  pdf.setFontSize(12);

  const dataset =
    reportType === "orders" ? orderReport?.allOrders : cottageReport?.allBookings;

  if (dataset) {
    // Group by status
    const grouped: Record<string, any[]> = {};
    dataset.forEach((item: any) => {
      const status = item.status || "unknown";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(item);
    });

    let y = 30;

    Object.entries(grouped).forEach(([status, items]) => {
      pdf.setFontSize(14);
      pdf.text(`Status: ${status}`, 10, y);
      y += 8;
      pdf.setFontSize(10);

      items.forEach((item: any, idx: number) => {
        let line = "";
        if (reportType === "orders") {
          line = `${idx + 1}. ${item.date} | ${item.customerInfo?.name || "N/A"} | Rs.${item.total} | ${item.paymentStatus}`;
        } else {
          line = `${idx + 1}. ${item.cottageName} | ${new Date(item.checkIn).toLocaleDateString()} → ${new Date(item.checkOut).toLocaleDateString()} | Guests: ${item.guests} | Rs.${item.totalAmount} | ${item.paymentStatus || "N/A"}`;
        }

        pdf.text(line, 15, y);
        y += 6;

        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
      });

      y += 10;
    });
  }

  pdf.save(`${reportType}-report.pdf`);
};


  // 🔹 Export Excel
  const exportExcel = () => {
    let wb = XLSX.utils.book_new();

    if (reportType === "orders" && orderReport) {
      const ws1 = XLSX.utils.json_to_sheet(orderReport.statusSummary);
      const ws2 = XLSX.utils.json_to_sheet(orderReport.recentOrders);
      XLSX.utils.book_append_sheet(wb, ws1, "Status Summary");
      XLSX.utils.book_append_sheet(wb, ws2, "Recent Orders");
    } else if (reportType === "cottages" && cottageReport) {
      const ws1 = XLSX.utils.json_to_sheet(cottageReport.statusSummary);
      const ws2 = XLSX.utils.json_to_sheet(cottageReport.cottageSummary);
      XLSX.utils.book_append_sheet(wb, ws1, "Status Summary");
      XLSX.utils.book_append_sheet(wb, ws2, "Cottages");
    }

    XLSX.writeFile(wb, `${reportType}-report.xlsx`);
  };

  // 🔹 Export CSV
  const exportCSV = () => {
    let dataToExport = [];
    
    if (reportType === "orders" && orderReport) {
      // Export detailed order data
      dataToExport = orderReport.allOrders.map((order: any) => ({
        Date: order.date,
        CustomerName: order.customerInfo?.name || "N/A",
        Total: order.total,
        PaymentStatus: order.paymentStatus,
        OrderStatus: order.status
      }));
    } else if (reportType === "cottages" && cottageReport) {
      dataToExport = cottageReport.allBookings.map((booking: any) => ({
        CottageName: booking.cottageName,
        CheckIn: booking.checkIn,
        CheckOut: booking.checkOut,
        Guests: booking.guests,
        TotalAmount: booking.totalAmount,
        PaymentStatus: booking.paymentStatus || "N/A"
      }));
    }
    
    if (dataToExport.length === 0) {
      console.warn("No data to export");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // reportTypes removed — page shows only Order Reports

  const timeRanges = [
    { value: "week", label: "Last Week" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last Quarter" },
    { value: "year", label: "Last Year" },
  ];

  const renderReportContent = () => {
    switch (reportType) {
      case "orders":
        if (loading) return <p>Loading...</p>;
        if (!orderReport) return <p>No report data found.</p>;
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Order Reports</h2>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {orderReport.totalOrders}
                  </div>
                  <p className="text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-success">
                    Rs. {orderReport.totalRevenue}
                  </div>
                  <p className="text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-accent">
                    {orderReport.paymentSummary.find(
                      (p: any) => p._id === "paid"
                    )?.count || 0}
                  </div>
                  <p className="text-muted-foreground">Paid Orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderReport.statusSummary.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="capitalize">{row._id}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell>Rs. {row.totalRevenue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={orderReport.statusSummary}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {orderReport.statusSummary.map(
                          (_entry: any, index: number) => (
                            <Cell
                              key={index}
                              fill={[
                                "#22C55E",
                                "#3B82F6",
                                "#EAB308",
                                "#F97316",
                                "#EF4444",
                              ][index % 5]}
                            />
                          )
                        )}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderReport.recentOrders.map((o: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{o.date}</TableCell>
                        <TableCell>{o.customerInfo?.name || "N/A"}</TableCell>
                        <TableCell>Rs. {o.total}</TableCell>
                        <TableCell>
                          <Badge>{o.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.paymentStatus}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case "cottages":
        if (loading) return <p>Loading...</p>;
        if (!cottageReport) return <p>No report data found.</p>;
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Cottage Reports</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">
                  {cottageReport.totalBookings}
                </div>
                <p className="text-muted-foreground">Total Bookings</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-success">
                  Rs. {cottageReport.totalRevenue}
                </div>
                <p className="text-muted-foreground">Total Revenue</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent">
                  {cottageReport.statusSummary.find((s:any)=>s._id==="confirmed")?.count || 0}
                </div>
                <p className="text-muted-foreground">Confirmed Bookings</p>
              </CardContent></Card>
            </div>

            {/* Cottage Summary Table */}
            <Card>
              <CardHeader><CardTitle>Cottage Summary</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cottage</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Guests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cottageReport.cottageSummary.map((c:any,idx:number)=>(
                      <TableRow key={idx}>
                        <TableCell>{c._id}</TableCell>
                        <TableCell>{c.bookings}</TableCell>
                        <TableCell>Rs. {c.revenue}</TableCell>
                        <TableCell>{c.avgGuests.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card>
              <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie data={cottageReport.statusSummary} dataKey="count" cx="50%" cy="50%" outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {cottageReport.statusSummary.map((_:any,i:number)=>(
                        <Cell key={i} fill={["#22C55E","#3B82F6","#EF4444"][i%3]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cottage</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cottageReport.recentBookings.map((b:any,idx:number)=>(
                      <TableRow key={idx}>
                        <TableCell>{b.cottageName}</TableCell>
                        <TableCell>{new Date(b.checkIn).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(b.checkOut).toLocaleDateString()}</TableCell>
                        <TableCell>{b.guests}</TableCell>
                        <TableCell>Rs. {b.totalAmount}</TableCell>
                        <TableCell><Badge>{b.status}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{b.paymentStatus || "N/A"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports for your farm marketplace
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          {/* Export Excel button removed per request */}
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card className="border-border bg-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {/* Fixed to Order Reports (selector removed) */}
              <div className="p-3 border border-dashed rounded text-sm">Order Reports</div>
            </div>

            <div className="flex-1">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-gradient-primary" onClick={fetchReport}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div id="report-content">{renderReportContent()}</div>
    </div>
  );
};

export default Reports;
