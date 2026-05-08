const mongoose = require('mongoose');

const LearningMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },

    type: { type: String, enum: ['FILE', 'LINK', 'VIDEO', 'DOC', 'OTHER'], default: 'OTHER', index: true },
    link: { type: String },     
    fileUrl: { type: String },  
    tags: [{ type: String }],

    visibility: { type: String, enum: ['PUBLIC', 'DEPARTMENT', 'YEAR', 'PRIVATE'], default: 'PUBLIC' },
    department: { type: String }, 
    year: { type: Number },       
  },
  { timestamps: true }
);

LearningMaterialSchema.index({ title: 'text', description: 'text' });
LearningMaterialSchema.index({ tags: 1 });

module.exports = mongoose.model('LearningMaterial', LearningMaterialSchema);