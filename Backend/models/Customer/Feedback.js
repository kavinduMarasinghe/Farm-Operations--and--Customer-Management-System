const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Feedback = mongoose.model('customerFeedback', feedbackSchema);

module.exports = Feedback;
