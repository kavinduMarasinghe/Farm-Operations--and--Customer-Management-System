const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  cottageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cottage',
    required: true,
  },
  cottageName: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const Booking = mongoose.model('CottageBooking', bookingSchema);

module.exports = Booking;
