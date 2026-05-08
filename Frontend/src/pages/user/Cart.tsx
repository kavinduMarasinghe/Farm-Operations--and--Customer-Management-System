import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Extend cart item type from backend
interface BackendCartItem {
  _id: string; // Cart item ID
  productId: {
    _id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    quantity: number; // available stock
  };
  quantity: number; // cart quantity
}

const Cart = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<BackendCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  // Fetch cart items from backend
  const fetchCart = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8070/api/cart/user/${user.id}`);
      if (response.data.success) {
        setCart(response.data.data);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  // Update quantity
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await axios.delete(`http://localhost:8070/api/cart/${itemId}`);
        setCart(cart.filter((item) => item._id !== itemId));
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
        });
        return;
      }

      const response = await axios.put(`http://localhost:8070/api/cart/${itemId}`, { 
        quantity: newQuantity 
      });
      if (response.data.success) {
        setCart(cart.map((item) => (item._id === itemId ? { ...item, quantity: newQuantity } : item)));
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update item quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove item
  const handleRemoveItem = async (itemId: string, productName: string) => {
    try {
      await axios.delete(`http://localhost:8070/api/cart/${itemId}`);
      setCart(cart.filter((item) => item._id !== itemId));
      toast({
        title: "Item removed",
        description: `${productName} has been removed from your cart.`,
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Calculate total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.productId.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">Loading cart...</div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-nature">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-4">Your cart is empty</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link to="/marketplace">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted overflow-hidden">
                          <img
                            src={item.productId.image}
                            alt={item.productId.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-primary">{item.productId.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.productId.category}</p>
                          <p className="text-lg font-bold text-accent">Rs. {item.productId.price}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-primary">Rs. {(item.productId.price * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item._id, item.productId.name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.reduce((count, item) => count + item.quantity, 0)} items)</span>
                    <span>Rs. {getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-accent">Rs. {getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => window.location.href = "/checkout"}
                  >
                    Proceed to Checkout
                  </Button>
                  <Link to="/" className="w-full block">
                    <Button variant="outline" size="lg" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
