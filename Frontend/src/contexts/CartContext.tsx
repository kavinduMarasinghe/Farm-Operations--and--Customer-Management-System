// src/contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Product type
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
}

// Cart item type
export interface CartItem extends Product {
  quantity: number;
  cartItemId?: string; // Backend cart item ID for API operations
}

// Cottage type
export interface Cottage {
  id: string;
  name: string;
  location: string;
  capacity: number;
  pricePerNight: number;
  image: string;
  available: boolean;
  amenities: string[];
}

// Booking type
export interface Booking {
  id: string;
  cottageId: string;
  cottageName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
}

// Order type
export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'out-for-delivery' | 'completed';
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];
  bookings: Booking[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addOrder: (order: Order) => void;
  addBooking: (booking: Booking) => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  getCartQuantityCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Fetch cart from backend when user is available
  useEffect(() => {
    const fetchCart = async () => {
      if (!user?.id) return;
      
      try {
        const res = await axios.get(`http://localhost:8070/api/cart/user/${user.id}`);
        if (res.data.success) {
          const backendItems = res.data.data.map((item: any) => ({
            id: item.productId._id,
            cartItemId: item._id, // Store the actual cart item ID
            name: item.productId.name,
            category: item.productId.category,
            price: item.productId.price,
            image: item.productId.image,
            description: item.productId.description || '',
            quantity: item.quantity,
          }));
          setCart(backendItems);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    if (user) {
      fetchCart();
    } else {
      setCart([]); // Clear cart if user is not authenticated
    }
  }, [user]);

  // Add product to cart
  const addToCart = async (product: Product) => {
    if (!user?.id) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Adding to cart:', { productId: (product as any)._id || product.id, userId: user.id });
      
      await axios.post('http://localhost:8070/api/cart', {
        productId: // support backend objects that use _id
          // @ts-ignore allow either shape
          (product as any)._id || product.id,
        quantity: 1,
        userId: user.id,
      });

      // Refresh cart from backend to get proper cart item IDs
      const res = await axios.get(`http://localhost:8070/api/cart/user/${user.id}`);
      if (res.data.success) {
        const backendItems = res.data.data.map((item: any) => ({
          id: item.productId._id,
          cartItemId: item._id, // Store the actual cart item ID
          name: item.productId.name,
          category: item.productId.category,
          price: item.productId.price,
          image: item.productId.image,
          description: item.productId.description || '',
          quantity: item.quantity,
        }));
        setCart(backendItems);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId: string) => {
    if (!user?.id) return;

    try {
      // Find cart item by product ID
      const cartItem = cart.find(item => item.id === productId);
      if (!cartItem || !cartItem.cartItemId) return;

      await axios.delete(`http://localhost:8070/api/cart/${cartItem.cartItemId}`);
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // Update quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem || !cartItem.cartItemId) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`http://localhost:8070/api/cart/${cartItem.cartItemId}`, { quantity });
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // ✅ Clear cart
  const clearCart = async () => {
    if (!user?.id) return;
    
    try {
      // Clear cart in backend
      await axios.delete(`http://localhost:8070/api/cart/user/${user.id}/clear`);
      console.log('Cart cleared in backend');
    } catch (error) {
      console.error('Error clearing cart in backend:', error);
      // Continue with local clearing even if backend fails
    }
    
    // Clear local cart state
    setCart([]);
  };

  const addOrder = (order: Order) => {
    setOrders(prevOrders => [...prevOrders, order]);
    clearCart();
  };

  const addBooking = (booking: Booking) => {
    setBookings(prevBookings => [...prevBookings, booking]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.length;
  };

  const getCartQuantityCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        bookings,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addOrder,
        addBooking,
        getCartTotal,
        getCartItemsCount,
        getCartQuantityCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
