import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState<any | null>(null);
  const [deletingRefund, setDeletingRefund] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      const res = await fetch(`${API_BASE}/api/refunds`);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setRefunds(json.data);
      }
    } catch (err) {
      console.error("Failed to load refunds", err);
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (refundId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingRefund(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      
      const res = await fetch(`${API_BASE}/api/refunds/${refundId}/process`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminResponse: adminResponse.trim(),
          adminId: 'admin' // TODO: Replace with actual admin ID when auth is implemented
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to process refund');
      }

      toast.success(`Refund ${status} successfully`);
      fetchRefunds();
      setIsRefundDialogOpen(false);
      setSelectedRefund(null);
      setAdminResponse("");

    } catch (err: any) {
      console.error('Process refund error:', err);
      toast.error(err.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const deleteRefund = async (refundId: string) => {
    try {
      setDeletingRefund(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      
      const res = await fetch(`${API_BASE}/api/refunds/${refundId}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success('Refund deleted successfully');
        fetchRefunds(); // Refresh the list
        setIsDeleteDialogOpen(false);
        setRefundToDelete(null);
      } else {
        throw new Error(json.message || 'Failed to delete refund');
      }
    } catch (err: any) {
      console.error('Delete refund error:', err);
      toast.error(err.message || 'Failed to delete refund');
    } finally {
      setDeletingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Refund Management</h1>
        <p className="text-muted-foreground">Process and manage customer refund requests.</p>
      </div>

      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading refunds...</div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No refund requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund._id}>
                    <TableCell className="font-mono text-xs">
                      {refund.orderId?._id?.substring(0, 8) || refund.orderId?.substring(0, 8) || 'N/A'}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {refund.customerId?.fullName || 'Unknown Customer'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {refund.customerId?.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rs. {refund.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(refund.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {refund.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsRefundDialogOpen(true);
                            }}
                          >
                            Process
                          </Button>
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {refund.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                            {refund.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setRefundToDelete(refund);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Processing Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Process Refund Request</DialogTitle>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order ID</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {selectedRefund.orderId?._id || selectedRefund.orderId || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm font-semibold bg-muted p-2 rounded">
                    Rs. {selectedRefund.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Email</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedRefund.customerId?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Request Date</Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {new Date(selectedRefund.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Customer Message</Label>
                <p className="text-sm bg-muted p-3 rounded border">
                  {selectedRefund.message}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Order Details</Label>
                <div className="bg-muted p-3 rounded border">
                  <p className="text-sm font-medium mb-2">Items:</p>
                  {selectedRefund.orderDetails?.items?.map((item: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{item.name} (Qty: {item.quantity})</span>
                      <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="text-sm mt-2 pt-2 border-t">
                    <strong>Order Date: {selectedRefund.orderDetails?.date}</strong>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="admin-response">Admin Response (Optional)</Label>
                <Textarea
                  id="admin-response"
                  placeholder="Add a message for the customer..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRefundDialogOpen(false)}
                disabled={processingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRefund && processRefund(selectedRefund._id, 'rejected')}
                disabled={processingRefund}
              >
                {processingRefund ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={() => selectedRefund && processRefund(selectedRefund._id, 'approved')}
                disabled={processingRefund}
              >
                {processingRefund ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Refund Request
            </DialogTitle>
          </DialogHeader>

          {refundToDelete && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this approved refund request? This action cannot be undone.
              </p>
              
              <div className="bg-muted/50 p-3 rounded-lg border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p>Rs. {refundToDelete.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span>
                    <p>{refundToDelete.customerId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p>{new Date(refundToDelete.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-green-600 font-medium">Approved</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setRefundToDelete(null);
                }}
                disabled={deletingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => refundToDelete && deleteRefund(refundToDelete._id)}
                disabled={deletingRefund}
              >
                {deletingRefund ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRefunds;