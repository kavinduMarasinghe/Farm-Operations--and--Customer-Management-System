// src/pages/EmployeeTasks.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CheckSquare, Clock, AlertCircle, CheckCircle2, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  assignedDate: string;
  estimatedHours: number;
  assignedTo: string;
}

const API = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8070";

export default function EmployeeTasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  // map backend <-> UI statuses
  const fromApiStatus = (s: string): Task["status"] => {
    if (s === "todo") return "pending";
    if (s === "in-progress" || s === "in_progress") return "in-progress";
    if (s === "completed" || s === "done") return "completed";
    return "pending";
  };
  const toApiStatus = (s: Task["status"]): "todo" | "in-progress" | "completed" =>
    s === "pending" ? "todo" : s;

  useEffect(() => {
    if (!user) {
      console.warn("⚠️ No logged-in employee");
      return;
    }

    (async () => {
      try {
        const r = await fetch(`${API}/api/tasks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!r.ok) throw new Error(await r.text());

        const list = await r.json();
        console.log("✅ API tasks response:", list);
        console.log("👤 Current Employee (for filtering):", user);

        const mine = (Array.isArray(list) ? list : []).filter((t: any) => {
          if (!t.assignedTo) return true; // unassigned → show to all

          const raw =
            t?.assignedTo?._id ??
            t?.assignedTo?.id ??
            t?.assignedTo?.email ??
            t?.assignedTo?.name ??
            t?.assignedTo ??
            "";

          const assignee = String(raw).toLowerCase();
          const userId = String(user.id ?? "").toLowerCase();
          const userEmail = String(user.email ?? "").toLowerCase();
          const userName = String(user.name ?? "").toLowerCase();

          const matches =
            assignee === userId ||
            assignee.startsWith(userId.slice(0, 6)) || // partial id match
            (!!userEmail && assignee === userEmail) ||
            (!!userName && assignee === userName);

          console.log("🔎 Checking task:", {
            taskId: t._id,
            rawAssignedTo: t.assignedTo,
            normalizedAssignee: assignee,
            matches,
          });

          return matches;
        });

        const normalized: Task[] = mine.map((t: any) => ({
          id: String(t._id ?? t.id ?? Date.now()),
          title: t.title ?? "Untitled Task",
          description: t.description ?? "No description provided",
          priority: (t.priority ?? "medium") as Task["priority"],
          status: fromApiStatus(t.status ?? "todo"),
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : new Date().toISOString(),
          assignedDate: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          estimatedHours: Number.isFinite(t.estimatedHours)
            ? t.estimatedHours
            : Number.parseFloat(t.estimatedHours) || 0,
          assignedTo: String(
            t.assignedTo?._id ??
              t.assignedTo?.id ??
              t.assignedTo?.email ??
              t.assignedTo?.name ??
              t.assignedTo ??
              ""
          ),
        }));

        console.log("🧮 Normalized employee tasks:", normalized);
        setTasks(normalized);
      } catch (e) {
        console.error("❌ Failed to load tasks:", e);
        setTasks([]);
      }
    })();
  }, [user, token]);

  // update task status
  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      const r = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: toApiStatus(newStatus) }),
      });
      if (!r.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: fromApiStatus("todo") } : t
          )
        );
        console.error(await r.text());
      }
    } catch (e) {
      console.error("❌ Failed to update task:", e);
    }
  };

  // helpers
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "in-progress": return <Play className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending": return "bg-farm-yellow/20 text-farm-brown";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-farm-green/20 text-farm-green";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low": return "bg-gray-100 text-gray-800";
      case "medium": return "bg-farm-yellow/20 text-farm-brown";
      case "high":
      case "urgent": return "bg-red-100 text-red-800";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="w-full min-h-screen p-6 pr-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 bg-gradient-farm rounded-lg flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned farm tasks</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-farm-yellow" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-farm-green" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(
                    (t) => getDaysUntilDue(t.dueDate) < 0 && t.status !== "completed"
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const daysUntilDue = getDaysUntilDue(task.dueDate);
          const isOverdue = daysUntilDue < 0 && task.status !== "completed";
          return (
            <Card
              key={task.id}
              className={`w-full ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {getStatusIcon(task.status)}
                        <span className="ml-1 capitalize">
                          {task.status.replace("-", " ")}
                        </span>
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {task.description}
                    </CardDescription>
                  </div>
                  {task.status !== "completed" && (
                    <div className="flex gap-2">
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          updateTaskStatus(task.id, value as Task["status"])
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Assigned Date</p>
                    <p className="font-medium">
                      {new Date(task.assignedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated Hours</p>
                    <p className="font-medium">{task.estimatedHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Until Due</p>
                    <p
                      className={`font-medium ${
                        isOverdue
                          ? "text-red-600"
                          : daysUntilDue <= 2
                          ? "text-farm-yellow"
                          : ""
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : `${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tasks.length === 0 && (
          <Card className="w-full">
            <CardContent className="py-8 text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tasks assigned yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
