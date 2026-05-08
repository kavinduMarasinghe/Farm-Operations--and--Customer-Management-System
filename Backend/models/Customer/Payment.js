const mongoose = require('mongoose');

// Payment schema for storing payment details
const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  cardholderName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled'],
    default: 'pending',
  },
  paymentDate: { type: Date, default: Date.now },
});

const Payment = mongoose.model('customerPayment', paymentSchema);

module.exports = Payment;
