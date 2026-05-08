const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    bio: { type: String },
    password: { type: String, required: true }, 
    role: { type: String, default: "customer" },
  },
  { timestamps: true }
);


const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
