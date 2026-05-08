const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    target: {
      type: mongoose.Schema.Types.Mixed,
      required: function() {
        return this.type !== 'GENERAL';
      }
    },

    type: {
      type: String,
      enum: ['GENERAL', 'LABTOUR', 'SESSION', 'MATERIAL'],
      default: 'GENERAL',
      index: true,
    },

    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },

    hidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

FeedbackSchema.pre('save', async function(next) {
  if (this.type === 'MATERIAL' && this.target) {
    // For MATERIAL feedback, target should be a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(this.target)) {
      return next(new Error('Invalid material ID for MATERIAL feedback'));
    }
    // Optionally validate that the material exists
    const LearningMaterial = mongoose.model('LearningMaterial');
    const material = await LearningMaterial.findById(this.target);
    if (!material) {
      return next(new Error('Referenced material does not exist'));
    }
  }
  next();
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
