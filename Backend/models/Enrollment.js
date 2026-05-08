const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  programType: {
    type: String,
    required: true,
    enum: ['training', 'workshop', 'seminar', 'certification']
  },
  programName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['ENROLLED', 'COMPLETED', 'DROPPED', 'PENDING'],
    default: 'ENROLLED'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, programType: 1, programName: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);