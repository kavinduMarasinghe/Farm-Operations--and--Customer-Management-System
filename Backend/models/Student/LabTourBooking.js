const mongoose = require('mongoose');

const LabTourBookingSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTour', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },

    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// helpful compound index for queries
LabTourBookingSchema.index({ tour: 1, student: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('LabTourBooking', LabTourBookingSchema);
