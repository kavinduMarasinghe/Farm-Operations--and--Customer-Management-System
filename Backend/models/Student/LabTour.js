const mongoose = require('mongoose');

const LabTourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    location: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // Format: "HH:MM" (24-hour format)
    endTime: { type: String, required: true },   // Format: "HH:MM" (24-hour format)
    capacity: { type: Number, default: 20, min: 0 },
    
    archived: { type: Boolean, default: false, index: true },

    // optional auditing (if Admin model exists)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

LabTourSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('LabTour', LabTourSchema);
