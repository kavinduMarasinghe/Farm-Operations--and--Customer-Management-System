import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const Payment = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);

  useEffect(() => {
    const info = localStorage.getItem('checkoutInfo');
    if (info) {
      setCheckoutInfo(JSON.parse(info));
    } else {
      navigate('/checkout');
    }
  }, [navigate]);

  const handleInputChange = (field: keyof typeof cardInfo, value: string) => {
    setCardInfo(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Luhn algorithm validation
  const isValidCardNumber = (number: string) => {
    const clean = number.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(clean)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Expiry validation
  const isValidExpiry = (expiry: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [mm, yy] = expiry.split('/').map(v => parseInt(v, 10));
    if (mm < 1 || mm > 12) return false;

    const current = new Date();
    const expDate = new Date(2000 + yy, mm - 1);
    const now = new Date(current.getFullYear(), current.getMonth());

    return expDate >= now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!/^[A-Za-z ]{3,}$/.test(cardInfo.cardholderName)) {
      toast({ title: "Invalid Name", description: "Enter a valid cardholder name.", variant: "destructive" });
      return;
    }

    if (!isValidCardNumber(cardInfo.cardNumber)) {
      toast({ title: "Invalid Card Number", description: "Enter a valid 16-digit card number.", variant: "destructive" });
      return;
    }

    if (!isValidExpiry(cardInfo.expiryDate)) {
      toast({ title: "Invalid Expiry Date", description: "Enter a valid future expiry date (MM/YY).", variant: "destructive" });
      return;
    }

    if (!/^\d{3,4}$/.test(cardInfo.cvv)) {
      toast({ title: "Invalid CVV", description: "CVV must be 3 or 4 digits.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // 1️⃣ Create order
      const orderPayload = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
        })),
        total: checkoutInfo.finalTotal || getCartTotal(),
        subtotal: checkoutInfo.subtotal || getCartTotal(),
        discount: checkoutInfo.discount || 0,
        couponUsed: checkoutInfo.selectedCoupon ? {
          refundId: checkoutInfo.selectedCoupon._id,
          couponAmount: checkoutInfo.selectedCoupon.amount,
          orderId: checkoutInfo.selectedCoupon.orderId?._id || checkoutInfo.selectedCoupon.orderId
        } : null,
        status: "processing",
        paymentStatus: "paid",
        customerInfo: checkoutInfo.customerInfo,
        date: new Date().toISOString().split('T')[0],
      };

      const orderRes = await axios.post("http://localhost:8070/api/cusOrders", orderPayload);
      if (!orderRes.data.success || !orderRes.data.data?._id) {
        throw new Error(orderRes.data.message || "Failed to create order");
      }

      const createdOrder = orderRes.data.data;

      // 2️⃣ Save payment record
      const paymentPayload = {
        orderId: createdOrder._id,
        cardholderName: cardInfo.cardholderName,
        cardNumber: cardInfo.cardNumber,
        expiryDate: cardInfo.expiryDate,
        cvv: cardInfo.cvv,
        totalAmount: checkoutInfo.finalTotal || getCartTotal(),
      };

      const paymentRes = await axios.post("http://localhost:8070/api/payments", paymentPayload);

      if (paymentRes.status === 201) {
        // Mark coupon as used if one was applied
        if (checkoutInfo.selectedCoupon) {
          try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
            await axios.put(`${API_BASE}/api/refunds/${checkoutInfo.selectedCoupon._id}/use-coupon`, {
              orderId: createdOrder._id
            });
          } catch (error) {
            console.error('Failed to mark coupon as used:', error);
          }
        }

        toast({
          title: "Payment Successful!",
          description: `Order ${createdOrder._id} has been placed and payment recorded.${checkoutInfo.selectedCoupon ? ` Coupon discount of Rs. ${checkoutInfo.selectedCoupon.amount.toFixed(2)} applied!` : ''}`,
        });
        localStorage.removeItem("checkoutInfo");

        clearCart();
        navigate("/orders");
      } else {
        throw new Error("Payment failed to save");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!checkoutInfo) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Secure Payment</h1>
            <div className="flex items-center justify-center text-muted-foreground">
              <Lock className="h-4 w-4 mr-2" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Card Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={cardInfo.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={cardInfo.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        value={cardInfo.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={cardInfo.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rs. {getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee</span>
                      <span>Rs. 0.00</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-accent">Rs. {getCartTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Pay Rs. {getCartTotal().toFixed(2)}
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
