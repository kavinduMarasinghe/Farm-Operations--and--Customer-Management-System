const CartItem = require("../../models/Customer/Cart");

// Add an item to the cart
const addToCart = async (req, res) => {
  try {
    console.log('Add to cart request:', req.body);
    const { productId, quantity, userId } = req.body;
    
    if (!userId) {
      console.log('Missing userId in request');
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    
    if (!productId) {
      console.log('Missing productId in request');
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Check if the user already has this product in their cart
    const existingCartItem = await CartItem.findOne({ userId, productId });

    if (existingCartItem) {
      // If the item is already in the cart, update the quantity
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
      return res.status(200).json({ success: true, data: existingCartItem });
    }

    // If no cart item exists, create a new cart item
    const newCartItem = new CartItem({
      productId,
      quantity,
      userId,
    });

    await newCartItem.save();
    res.status(201).json({ success: true, data: newCartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update the quantity of an item in the cart
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;  // Cart item ID
    const { quantity } = req.body;

    const cartItem = await CartItem.findById(itemId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    // Update the quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({ success: true, data: cartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove an item from the cart
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;  // Cart item ID

    const cartItem = await CartItem.findByIdAndDelete(itemId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all items in the user's cart
const getCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const cartItems = await CartItem.find({ userId }).populate("productId");
    if (cartItems.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "Cart is empty" });
    }

    res.status(200).json({ success: true, data: cartItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get cart items by user ID (for API route)
const getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const cartItems = await CartItem.find({ userId }).populate("productId");
    res.status(200).json({ 
      success: true, 
      data: cartItems,
      message: cartItems.length === 0 ? "Cart is empty" : `Found ${cartItems.length} items`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Clear all cart items for a user
const clearUserCart = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const result = await CartItem.deleteMany({ userId });
    
    res.status(200).json({ 
      success: true, 
      message: `Cart cleared successfully. Removed ${result.deletedCount} items.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { addToCart, updateCartItem, removeFromCart, getCartItems, getCartByUserId, clearUserCart };
