const express = require("express");
const router = express.Router();
const { addToCart, updateCartItem, removeFromCart, getCartItems, getCartByUserId, clearUserCart } = require("../../controllers/Customer/cartController");

// Add item to cart
router.post("/", addToCart);

// Update item quantity in cart
router.put("/:itemId", updateCartItem);

// Remove item from cart
router.delete("/:itemId", removeFromCart);

// Get all items in the user's cart
router.get("/", getCartItems);

// Get cart items by user ID
router.get("/user/:userId", getCartByUserId);

// Clear all cart items for a user
router.delete("/user/:userId/clear", clearUserCart);

module.exports = router;
