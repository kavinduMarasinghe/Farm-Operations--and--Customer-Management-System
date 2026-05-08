const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"], // keep your existing values
      default: "todo",
    },
    // ⬇️ use Employee _id here
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    dueDate: { type: Date, required: true },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
