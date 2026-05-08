const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    activity: {
      type: String,
      required: true,
      trim: true,
    },
    overtime: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Timesheet = mongoose.model("Timesheet", timesheetSchema);

module.exports = Timesheet;
