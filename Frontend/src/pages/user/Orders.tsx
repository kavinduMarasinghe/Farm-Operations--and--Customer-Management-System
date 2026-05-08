import React, { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Clock, Trash2, FileDown, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface Order {
  _id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;   // ✅ added
  customerInfo: CustomerInfo;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'processing': return <Package className="h-4 w-4" />;
    case 'out-for-delivery': return <Truck className="h-4 w-4" />;
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getStatusProgress = (status: string) => {
  switch (status) {
    case 'pending': return 25;
    case 'processing': return 50;
    case 'out-for-delivery': return 75;
    case 'completed': return 100;
    default: return 0;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary' as const;
    case 'processing': return 'default' as const;
    case 'out-for-delivery': return 'default' as const;
    case 'completed': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const getPaymentVariant = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'paid': return 'default' as const;
    case 'unpaid': return 'destructive' as const;
    case 'refunded': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

const formatStatus = (status: string) =>
  status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const Orders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundMessage, setRefundMessage] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [existingRefunds, setExistingRefunds] = useState<{[orderId: string]: boolean}>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8070/api/cusOrders/user/${user.id}`);
      if (res.data.success) {
        setOrders(res.data.data || []);
      } else {
        // If no orders found, set empty array instead of showing error
        setOrders([]);
      }
    } catch (error: any) {
      console.error(error);
      // Check if it's a 404 (no orders found) - this is normal for new users
      if (error.response?.status === 404) {
        setOrders([]);
      } else {
        toast({
          title: "Server Error",
          description: "Failed to fetch orders. Try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRefunds = async () => {
    if (!user?.id) return;
    
    try {
      const res = await axios.get(`http://localhost:8070/api/refunds/customer/${user.id}`);
      if (res.data.success && res.data.data) {
        // Create a map of order IDs that have refunds
        const refundMap: {[orderId: string]: boolean} = {};
        res.data.data.forEach((refund: any) => {
          if (refund.orderId) {
            // Handle both populated and string order IDs
            const orderIdStr = typeof refund.orderId === 'object' ? refund.orderId._id : refund.orderId;
            refundMap[orderIdStr] = true;
          }
        });
        setExistingRefunds(refundMap);
      }
    } catch (error: any) {
      console.error('Error fetching existing refunds:', error);
      // Don't show error to user, just log it
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await axios.delete(`http://localhost:8070/api/cusOrders/${orderId}`);
      if (res.data.success) {
        toast({ title: "Order Cancelled", description: "Your order has been successfully cancelled." });
        setOrders(prev => prev.filter(order => order._id !== orderId));
      } else {
        toast({ title: "Error", description: res.data.message || "Failed to cancel order", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Server Error", description: "Failed to cancel order. Try again later.", variant: "destructive" });
    }
  };

  const downloadBill = (orderId: string) => {
    window.open(`http://localhost:8070/api/cusOrders/${orderId}/bill`, "_blank");
  };

  const submitRefundRequest = async () => {
    if (!selectedOrder || !refundMessage.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund request.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingRefund(true);
      
      const refundData = {
        orderId: selectedOrder._id,
        customerId: user?.id,
        amount: selectedOrder.total,
        message: refundMessage.trim(),
        orderDetails: {
          items: selectedOrder.items,
          date: selectedOrder.date
        }
      };

      console.log("Submitting refund request:", refundData);
      
      const response = await axios.post("http://localhost:8070/api/refunds", refundData);

      if (response.data && response.data.success) {
        toast({
          title: "Refund Requested",
          description: "Your refund request has been submitted for review.",
        });
        setShowRefundDialog(false);
        setRefundMessage("");
        setSelectedOrder(null);
        // Refresh existing refunds to update button visibility
        fetchExistingRefunds();
      } else {
        throw new Error(response.data?.message || "Failed to submit refund request");
      }
    } catch (error: any) {
      console.error("Refund request error:", error);
      let errorMessage = "Failed to submit refund request. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = "Refund service not available. Please contact support.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchExistingRefunds();
    }
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary text-lg">Loading orders...</div>;
  if (orders.length === 0)
    return (
      <div className="min-h-screen bg-gradient-nature">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-4">No Orders Yet</h2>
            <p className="text-lg text-muted-foreground mb-8">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/marketplace')}
              className="bg-primary hover:bg-primary/90"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );

  // ✅ Categorize orders
  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const renderOrderCard = (order: Order) => (
    <Card key={order._id}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order._id}</CardTitle>
            <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            {getStatusIcon(order.status)}
            <Badge variant={getStatusVariant(order.status)}>{formatStatus(order.status)}</Badge>
            <Badge variant={getPaymentVariant(order.paymentStatus)}>
              <DollarSign className="h-3 w-3 mr-1" />
              {formatStatus(order.paymentStatus)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-primary mb-2">Order Items</h4>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                    <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover"/>
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-primary mb-3">Order Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Order Status: {formatStatus(order.status)}</span>
              <span>{getStatusProgress(order.status)}%</span>
            </div>
            <Progress value={getStatusProgress(order.status)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pending</span><span>Processing</span><span>Out for Delivery</span><span>Completed</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-lg font-semibold">Total Amount</span>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-accent">Rs. {order.total.toFixed(2)}</span>
            {order.status === 'pending' && (
              <button className="flex items-center space-x-1 text-red-500 hover:text-red-700" onClick={() => cancelOrder(order._id)}>
                <Trash2 className="h-4 w-4" /><span className="text-sm font-medium">Cancel</span>
              </button>
            )}
            {order.status === 'completed' && !existingRefunds[order._id] && (
              <button
                className="flex items-center space-x-1 text-orange-500 hover:text-orange-700"
                onClick={() => {
                  console.log("Order for refund:", order);
                  setSelectedOrder(order);
                  setShowRefundDialog(true);
                }}
              >
                <RefreshCw className="h-4 w-4" /><span className="text-sm font-medium">Refund</span>
              </button>
            )}
            {order.status === 'completed' && existingRefunds[order._id] && (
              <span className="text-xs text-muted-foreground">Refund Requested</span>
            )}
            <button
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
              onClick={() => downloadBill(order._id)}
            >
              <FileDown className="h-4 w-4" /><span className="text-sm font-medium">Bill</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">My Orders</h1>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="space-y-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4">Active Orders</h2>
            {activeOrders.map(renderOrderCard)}
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Completed Orders</h2>
            {completedOrders.map(renderOrderCard)}
          </div>
        )}
      </div>

      {/* Refund Request Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded">
                <p className="text-sm font-medium">Order #{selectedOrder._id}</p>
                <p className="text-sm text-muted-foreground">Amount: Rs. {selectedOrder.total.toFixed(2)}</p>
              </div>
              
              <div>
                <Label htmlFor="refund-message">Reason for refund</Label>
                <Textarea
                  id="refund-message"
                  placeholder="Please explain why you're requesting a refund..."
                  value={refundMessage}
                  onChange={(e) => setRefundMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRefundDialog(false)}
              disabled={isSubmittingRefund}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRefundRequest}
              disabled={isSubmittingRefund}
            >
              {isSubmittingRefund ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
