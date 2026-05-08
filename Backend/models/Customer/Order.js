const mongoose = require('mongoose');

// Define the Order schema
const orderSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        description: { type: String },
      },
    ],
    total: { type: Number, required: true },
    subtotal: { type: Number }, // Original amount before discount
    discount: { type: Number, default: 0 }, // Discount amount applied
    couponUsed: {
      refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' },
      couponAmount: { type: Number },
      orderId: { type: String } // Original order ID from the refund
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'out-for-delivery', 'completed', 'cancelled'],
      required: true,
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // assumes a Customer model exists
      required: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      deliveryInstructions: { type: String }, // optional
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('customerOrder', orderSchema);
module.exports = Order;
