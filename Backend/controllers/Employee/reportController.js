import Timesheet from "../models/Timesheet.js";
import Task from "../models/Task.js";

export async function summary(req, res) {
  try {
    const [hoursByEmployee, tasksByStatus] = await Promise.all([
      // 1. Group total hours worked by each employee
      Timesheet.aggregate([
        {
          $group: {
            _id: "$employee",
            totalHours: { $sum: "$hours" },
          },
        },
        { $sort: { totalHours: -1 } }, // sort by most worked hours
      ]),

      // 2. Count tasks by their status
      Task.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // ✅ Send response
    res.json({
      hoursByEmployee,
      tasksByStatus,
    });
  } catch (err) {
    console.error("❌ Error in summary:", err);
    res.status(500).json({ error: "Failed to generate report summary" });
  }
}
