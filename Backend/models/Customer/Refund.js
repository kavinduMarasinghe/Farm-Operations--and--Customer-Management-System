const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customerOrder",
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 500
  },
  orderDetails: {
    items: [{
      id: String,
      name: String,
      category: String,
      price: Number,
      quantity: Number
    }],
    date: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: String,
    trim: true
  },
  isUsedAsCoupon: {
    type: Boolean,
    default: false
  },
  usedInOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customerOrder"
  },
  usedAt: {
    type: Date
  }
});

// Index for faster queries
refundSchema.index({ customerId: 1, status: 1 });
refundSchema.index({ orderId: 1 });

module.exports = mongoose.model("Refund", refundSchema);