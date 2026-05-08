const Timesheet = require("../../models/Employee/Timesheet.js");

// GET all entries
const getEntries = async (req, res) => {
  try {
    const entries = await Timesheet.find().sort({ date: -1 });
    res.json(
      entries.map((e) => ({
        id: e._id.toString(),
        employeeName: e.employeeName,
        date: e.date,
        hours: e.hours,
        activity: e.activity,
        overtime: e.overtime,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching work entries", error });
  }
};

// POST new entry
const addEntry = async (req, res) => {
  try {
    const { employeeName, date, hours, activity } = req.body;

    const overtime = hours > 8;

    const entry = new Timesheet({
      employeeName,
      date,
      hours,
      activity,
      overtime,
    });

    await entry.save();

    res.status(201).json({
      id: entry._id.toString(),
      employeeName: entry.employeeName,
      date: entry.date,
      hours: entry.hours,
      activity: entry.activity,
      overtime: entry.overtime,
    });
  } catch (error) {
    res.status(400).json({ message: "Error adding work entry", error });
  }
};

// PUT update entry
const updateEntry = async (req, res) => {
  try {
    const { employeeName, date, hours, activity } = req.body;
    const overtime = hours > 8;

    const entry = await Timesheet.findByIdAndUpdate(
      req.params.id,
      { employeeName, date, hours, activity, overtime },
      { new: true }
    );

    if (!entry) return res.status(404).json({ message: "Entry not found" });

    res.json({
      id: entry._id.toString(),
      employeeName: entry.employeeName,
      date: entry.date,
      hours: entry.hours,
      activity: entry.activity,
      overtime: entry.overtime,
    });
  } catch (error) {
    res.status(400).json({ message: "Error updating work entry", error });
  }
};

// DELETE entry
const deleteEntry = async (req, res) => {
  try {
    const entry = await Timesheet.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    res.json({ message: "Work entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting work entry", error });
  }
};

module.exports = {
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry
};
