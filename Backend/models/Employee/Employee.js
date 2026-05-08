const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["Worker", "Supervisor", "Driver", "Admin"],
      default: "Worker",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    hourlyRate: { type: Number, default: 0, min: 0 },

    // 🔑 Password field for login
    password: { type: String, required: true, minlength: 6, select: false },
    
    // 📅 Last login tracking
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Hash password before save
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare entered password with stored hash
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
