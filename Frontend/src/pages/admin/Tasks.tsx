// src/pages/Tasks.tsx
import { useState, useEffect } from "react";
import { CheckSquare, Plus, Calendar, User, Clock, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "completed";
  assignedTo: string; // employeeId
  dueDate: string;
  category: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  active: boolean;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    assignedTo: "",
    dueDate: "",
    category: "",
  });

  const API_URL = "http://localhost:8070/api/tasks";
  const EMPLOYEE_API_URL = "http://localhost:8070/api/employees";

  // ✅ Fetch tasks
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  // ✅ Fetch employees
  useEffect(() => {
    fetch(EMPLOYEE_API_URL)
      .then((res) => res.json())
      .then((data) =>
        setEmployees(
          (Array.isArray(data) ? data : []).map((e: any) => ({
            id: e.id ?? e._id,
            name: e.name ?? e.fullName ?? e.email ?? "Unknown",
            role: e.role ?? "",
            phone: e.phone ?? "",
            email: e.email ?? "",
            active: e.active ?? true,
          }))
        )
      )
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // ✅ Add Task
  const addTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask), // assignedTo is employeeId now
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("❌ Error adding task:", errData);
        return;
      }

      const data = await res.json();
      setTasks([data, ...tasks]);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        dueDate: "",
        category: "",
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // ✅ Delete Task
  const deleteTask = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // ✅ Update Task Status
  const updateTaskStatus = async (id: string, status: Task["status"]) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const updated = { ...task, status };
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("❌ Error updating task:", errData);
        return;
      }

      const data = await res.json();
      setTasks(tasks.map((t) => (t.id === id ? data : t)));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // ✅ Helper to show employee name
  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name || "Unknown";

  // ✅ Generate Task Report
  const generateTaskReport = () => {
    if (tasks.length === 0) {
      alert("No tasks to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FarmHub - Task Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Title", "Category", "Assigned To", "Due Date", "Priority", "Status"];
    const tableRows = tasks.map((t) => [
      t.title,
      t.category,
      getEmployeeName(t.assignedTo),
      new Date(t.dueDate).toLocaleDateString(),
      t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
      t.status === "in-progress" ? "In Progress" : t.status.charAt(0).toUpperCase() + t.status.slice(1),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: {
        fillColor: [22, 163, 74],
      },
    });

    doc.save("task_report.pdf");
  };

  const categories = [
    "Planting",
    "Harvesting",
    "Field Work",
    "Maintenance",
    "Livestock Care",
    "Equipment Operation",
    "Pest Control",
    "Quality Control",
  ];

  const getPriorityBadge = (priority: Task["priority"]) => {
    const variants = {
      low: "bg-farm-green/20 text-farm-green",
      medium: "bg-farm-yellow/20 text-farm-brown",
      high: "bg-farm-brown/20 text-farm-brown",
      urgent: "bg-destructive/20 text-destructive",
    };
    return (
      <Badge variant="secondary" className={variants[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: Task["status"]) => {
    const variants = {
      todo: "bg-muted text-muted-foreground",
      "in-progress": "bg-farm-yellow/20 text-farm-brown",
      completed: "bg-farm-green/20 text-farm-green",
    };
    return (
      <Badge variant="secondary" className={variants[status]}>
        {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Farm Tasks</h1>
            <p className="text-muted-foreground">Manage and track farm activities</p>
          </div>
        </div>
        <Button onClick={generateTaskReport} className="bg-gradient-farm hover:opacity-90 shadow-farm">
          <FileDown className="w-4 h-4 mr-2" /> Generate Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold text-foreground">{todoCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-farm-yellow" />
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-farm-green" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Urgent</p>
              <p className="text-2xl font-bold text-foreground">{urgentCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create New Task
          </CardTitle>
          <CardDescription>Add a new task for farm workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="e.g. Harvest paddy in north field"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newTask.category} onValueChange={(v) => setNewTask({ ...newTask, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed task description..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={newTask.assignedTo} onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newTask.priority} onValueChange={(v: Task["priority"]) => setNewTask({ ...newTask, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addTask} className="w-full bg-gradient-farm hover:opacity-90 shadow-farm">
                <Plus className="w-4 h-4 mr-2" /> Create Task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
          <CardDescription>View and manage all farm tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="border border-border hover:shadow-soft transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-medium">{getEmployeeName(task.assignedTo)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Due:</span>
                          <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{task.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Select value={task.status} onValueChange={(v: Task["status"]) => updateTaskStatus(task.id, v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => deleteTask(task.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks created yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
