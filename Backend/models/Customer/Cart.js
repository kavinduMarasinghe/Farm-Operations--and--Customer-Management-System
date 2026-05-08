const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // assuming products are stored in the Product collection
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1, // quantity cannot be less than 1
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // assuming a User model for tracking the customer
    required: true,
  },
}, { timestamps: true });

const CartItem = mongoose.model("CartItem", cartItemSchema);

module.exports = CartItem;
