const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    instructor: { type: String },

    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },

    capacity: { type: Number, default: 50, min: 0 },

    // list of student ids who joined
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true }],
  },
  { timestamps: true }
);

LiveSessionSchema.index({ title: 'text', instructor: 'text' });

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
