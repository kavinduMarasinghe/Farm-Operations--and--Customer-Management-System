import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Ticket, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  deliveryInstructions: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize with user data
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    deliveryInstructions: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Coupon state
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const fetchApprovedRefunds = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingCoupons(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      // Use availableOnly=true to get only unused approved refunds
      const response = await fetch(`${API_BASE}/api/refunds/customer/${user.id}?availableOnly=true`);
      const json = await response.json();
      
      if (json.success && Array.isArray(json.data)) {
        setAvailableCoupons(json.data);
      }
    } catch (error) {
      console.error('Error fetching approved refunds:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const markCouponAsUsed = async (refundId: string, orderId: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      const response = await fetch(`${API_BASE}/api/refunds/${refundId}/use-coupon`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        console.error('Failed to mark coupon as used');
      }
    } catch (error) {
      console.error('Error marking coupon as used:', error);
    }
  };

  useEffect(() => {
    // Initialize data when user becomes available
    if (user?.id) {
      // Update customer info with user data
      setCustomerInfo(prev => ({
        ...prev,
        name: user.fullName || user.name || prev.name,
        email: user.email || prev.email,
      }));
      
      fetchApprovedRefunds();
      setIsLoading(false);
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setIsLoading(false);
    }
  }, [user]);

  const calculateDiscount = () => {
    return selectedCoupon ? selectedCoupon.amount : 0;
  };

  const calculateFinalTotal = () => {
    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount); // Ensure total doesn't go below 0
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some items before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'cod') {
        const orderPayload = {
          customerId: user.id,  // ✅ Add actual customer ID
          date: new Date().toISOString().split('T')[0],
          items: cart,
          total: calculateFinalTotal(),
          subtotal: getCartTotal(),
          discount: calculateDiscount(),
          couponUsed: selectedCoupon ? {
            refundId: selectedCoupon._id,
            couponAmount: selectedCoupon.amount,
            orderId: selectedCoupon.orderId?._id || selectedCoupon.orderId
          } : null,
          status: 'pending',
          paymentStatus: 'unpaid',   // ✅ COD orders unpaid
          customerInfo,
        };

        const response = await fetch("http://localhost:8070/api/cusOrders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        const data = await response.json();

        if (!data.success || !data.data || !data.data._id) {
          toast({
            title: "Error",
            description: "Failed to create order",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: "Order Placed Successfully!",
          description: `Order ${data.data._id} has been placed. You will pay cash on delivery.${selectedCoupon ? ` Coupon discount of Rs. ${selectedCoupon.amount.toFixed(2)} applied!` : ''}`,
        });
        
        // If a coupon was used, mark it as used in the backend
        if (selectedCoupon) {
          await markCouponAsUsed(selectedCoupon._id, data.data._id);
          // Remove from local state as well
          setAvailableCoupons(prev => prev.filter(coupon => coupon._id !== selectedCoupon._id));
          setSelectedCoupon(null);
        }
        
        await clearCart();
        navigate('/orders');
      } else {
        // Card / Online → handled in Payment.tsx
        const checkoutData = {
          customerInfo,
          paymentMethod,
          selectedCoupon,
          finalTotal: calculateFinalTotal(),
          subtotal: getCartTotal(),
          discount: calculateDiscount()
        };
        localStorage.setItem('checkoutInfo', JSON.stringify(checkoutData));
        navigate('/payment');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Server Error",
        description: "Failed to create order. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while waiting for authentication or cart data
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-nature flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">Add some items to your cart before checkout.</p>
            <Button onClick={() => navigate('/')}>Go to Marketplace</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Delivery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InputField label="Full Name *" value={customerInfo.name} onChange={(val) => handleInputChange('name', val)} />
                    <InputField label="Email Address *" type="email" value={customerInfo.email} onChange={(val) => handleInputChange('email', val)} />
                    <InputField label="Phone Number *" type="tel" value={customerInfo.phone} onChange={(val) => handleInputChange('phone', val)} />
                    <TextareaField label="Delivery Address *" value={customerInfo.address} onChange={(val) => handleInputChange('address', val)} />
                    <TextareaField label="Delivery Instructions (Optional)" value={customerInfo.deliveryInstructions} onChange={(val) => handleInputChange('deliveryInstructions', val)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Credit/Debit Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online">Online Payment</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}

                    {/* Coupon Selection */}
                    {(availableCoupons.length > 0 || loadingCoupons) && (
                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary" />
                            <span className="font-medium">Apply Refund Coupon</span>
                            {availableCoupons.length > 0 && (
                              <Badge variant="secondary">
                                {availableCoupons.length} available
                              </Badge>
                            )}
                          </div>
                          
                          {loadingCoupons && (
                            <div className="text-sm text-muted-foreground">Loading coupons...</div>
                          )}
                          
                          {selectedCoupon ? (
                            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-primary" />
                                <div>
                                  <div className="text-sm font-medium">Coupon Applied</div>
                                  <div className="text-xs text-muted-foreground">
                                    Rs. {selectedCoupon.amount.toFixed(2)} discount
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCoupon(null)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Select onValueChange={(value) => {
                              const coupon = availableCoupons.find(c => c._id === value);
                              setSelectedCoupon(coupon);
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a coupon" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCoupons.map((coupon) => (
                                  <SelectItem key={coupon._id} value={coupon._id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>Rs. {coupon.amount.toFixed(2)} discount</span>
                                      <Badge variant="secondary" className="ml-2">
                                        {new Date(coupon.createdAt).toLocaleDateString()}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span>Subtotal</span>
                        <span>Rs. {getCartTotal().toFixed(2)}</span>
                      </div>
                      {selectedCoupon && (
                        <div className="flex justify-between mb-2 text-green-600">
                          <span>Coupon Discount</span>
                          <span>-Rs. {calculateDiscount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between mb-2">
                        <span>Delivery Fee</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-accent">Rs. {calculateFinalTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? 'Processing...'
                        : paymentMethod === 'cod'
                          ? 'Place Order (COD)'
                          : 'Proceed to Payment'
                      }
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Input & Textarea helpers
const InputField = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} />
  </div>
);

const TextareaField = ({ label, value, onChange }: any) => (
  <div>
    <Label>{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default Checkout;
