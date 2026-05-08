// Backend/models/Admin/Cottage.js
const mongoose = require("mongoose");

const cottageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  amenities: {
    type: [String], // array of strings
    default: []
  }
}, { timestamps: true });

const Cottage = mongoose.model("Cottage", cottageSchema);

module.exports = Cottage;
