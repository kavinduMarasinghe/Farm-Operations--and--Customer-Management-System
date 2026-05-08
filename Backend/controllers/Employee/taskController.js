const mongoose = require("mongoose");
const Task = require("../../models/Employee/Task.js");

// GET /api/tasks?assignee=<employeeId>
const getTasks = async (req, res) => {
  try {
    const { assignee } = req.query;
    const query = assignee ? { assignedTo: assignee } : {};

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    res.json(
      tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo?.toString(), // always return as string id
        dueDate: t.dueDate,
        category: t.category,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
};

// POST /api/tasks
const addTask = async (req, res) => {
  try {
    const { title, description, priority, status, assignedTo, dueDate, category } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "assignedTo (employeeId) is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "assignedTo must be a valid Employee id" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      assignedTo,                                   // <-- employee _id
      dueDate: dueDate ? new Date(dueDate) : null,  // accept "YYYY-MM-DD"
      category,
    });

    res.status(201).json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo?.toString(),
      dueDate: task.dueDate,
      category: task.category,
    });
  } catch (error) {
    res.status(400).json({ message: "Error adding task", error });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { title, description, priority, status, assignedTo, dueDate, category } = req.body;

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "assignedTo must be a valid Employee id" });
    }

    const updates = {
      title,
      description,
      priority,
      status,
      category,
    };

    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo?.toString(),
      dueDate: task.dueDate,
      category: task.category,
    });
  } catch (error) {
    res.status(400).json({ message: "Error updating task", error });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask
};
