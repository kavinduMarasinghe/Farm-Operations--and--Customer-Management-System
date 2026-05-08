import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface Customer {
  _id: string;
  fullName: string;
  email: string;
}

interface Order {
  _id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: "paid" | "unpaid";
  customerInfo: CustomerInfo;
  customerId: Customer; // ✅ Populated customer data
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "out-for-delivery":
      return <Truck className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary" as const;
    case "processing":
      return "default" as const;
    case "out-for-delivery":
      return "default" as const;
    case "completed":
      return "outline" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const formatStatus = (status: string) =>
  status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8070/api/cusOrders");
      if (res.data.success) {
        setOrders(res.data.data);
      } else {
        toast({
          title: "Error",
          description: res.data.message || "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Server Error",
        description: "Failed to fetch orders. Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await axios.put(`http://localhost:8070/api/cusOrders/${orderId}`, {
        status: newStatus,
      });
      toast({
        title: "Success",
        description: `Order updated to ${formatStatus(newStatus)}`,
      });
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: "paid" | "unpaid") => {
    try {
      await axios.put(`http://localhost:8070/api/cusOrders/${orderId}`, {
        paymentStatus: newPaymentStatus,
      });
      toast({
        title: "Success",
        description: `Payment status updated to ${newPaymentStatus}`,
      });
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const downloadBill = (orderId: string) => {
    window.open(`http://localhost:8070/api/cusOrders/${orderId}/bill`, "_blank");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const groupedOrders = {
    pending: orders.filter((o) => o.status === "pending"),
    processing: orders.filter((o) => o.status === "processing"),
    "out-for-delivery": orders.filter((o) => o.status === "out-for-delivery"),
    completed: orders.filter((o) => o.status === "completed"),
    cancelled: orders.filter((o) => o.status === "cancelled"),
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary text-lg">
        Loading orders...
      </div>
    );

  const renderTable = (title: string, data: Order[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Order ID</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Payment</th>
                <th className="px-3 py-2 text-left font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-muted/30 whitespace-nowrap"
                >
                  <td className="px-3 py-2 font-mono">#{order._id}</td>
                  <td className="px-3 py-2">{order.date}</td>
                  <td className="px-3 py-2">
                    {order.customerId?.fullName || order.customerInfo.name} <br />
                    <span className="text-xs text-muted-foreground">
                      {order.customerId?.email || order.customerInfo.email}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex items-center space-x-1">
                    {getStatusIcon(order.status)}
                    <Badge variant={getStatusVariant(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={order.paymentStatus === "paid" ? "default" : "destructive"}
                        className={
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      >
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => updatePaymentStatus(
                          order._id, 
                          order.paymentStatus === "paid" ? "unpaid" : "paid"
                        )}
                      >
                        {order.paymentStatus === "paid" ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-accent">
                    Rs. {order.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBill(order._id)}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDialogOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-center py-4 text-muted-foreground">
              No orders in this section.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {renderTable("Pending Orders", groupedOrders.pending)}
      {renderTable("Processing Orders", groupedOrders.processing)}
      {renderTable("Out for Delivery", groupedOrders["out-for-delivery"])}
      {renderTable("Completed Orders", groupedOrders.completed)}
      {renderTable("Cancelled Orders", groupedOrders.cancelled)}

      {/* Dialog for viewing and editing order */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Order #{selectedOrder?._id} - {selectedOrder?.customerId?.fullName || selectedOrder?.customerInfo.name}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Customer Info</h3>
                <p>{selectedOrder.customerId?.fullName || selectedOrder.customerInfo.name}</p>
                <p>{selectedOrder.customerId?.email || selectedOrder.customerInfo.email}</p>
                <p>{selectedOrder.customerInfo.phone}</p>
                <p>{selectedOrder.customerInfo.address}</p>
              </div>

              <div>
                <h3 className="font-semibold">Items</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id}>
                      {item.name} (x{item.quantity}) - Rs.
                      {item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">
                  Rs. {selectedOrder.total}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedOrder.status !== "processing" && (
                  <Button
                    onClick={() => updateStatus(selectedOrder._id, "processing")}
                  >
                    Mark Processing
                  </Button>
                )}
                {selectedOrder.status !== "out-for-delivery" && (
                  <Button
                    onClick={() =>
                      updateStatus(selectedOrder._id, "out-for-delivery")
                    }
                  >
                    Out for Delivery
                  </Button>
                )}
                {selectedOrder.status !== "completed" && (
                  <Button onClick={() => updateStatus(selectedOrder._id, "completed")}>
                    Mark Completed
                  </Button>
                )}
                {selectedOrder.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus(selectedOrder._id, "cancelled")}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
