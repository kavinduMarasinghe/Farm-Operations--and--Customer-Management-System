// src/pages/AdminWorkHours.tsx
import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Calendar, User, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface WorkEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  activity: string;
  overtime: boolean;
}

export default function AdminWorkHours() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    employeeId: "",
    employeeName: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    activity: "",
  });
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);

  const API_URL = "http://localhost:8070/api/timesheets";
  const EMP_API_URL = "http://localhost:8070/api/employees";

  // ✅ Load all timesheets
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((r: any) => ({
          id: String(r.id ?? r._id ?? Date.now()),
          employeeId: r.employeeId ?? r.employee?._id ?? "",
          employeeName: r.employeeName ?? r.employee?.name ?? "Unknown",
          date: r.date ?? r.createdAt ?? new Date().toISOString(),
          hours: typeof r.hours === "number" ? r.hours : Number(r.hours) || 0,
          activity: r.activity ?? "General Farm Work",
          overtime:
            typeof r.overtime === "boolean"
              ? r.overtime
              : (Number(r.hours) || 0) > 8,
        }));
        setWorkEntries(normalized);
      })
      .catch((err) => console.error("Error fetching entries:", err));
  }, []);

  // ✅ Load employees for dropdown (keep _id + name)
  useEffect(() => {
    fetch(EMP_API_URL)
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setEmployeeOptions(arr.filter((e: any) => e?._id && e?.name));
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  // ✅ Add new entry (always send id + name)
  const addWorkEntry = async () => {
    if (
      !newEntry.employeeId ||
      !newEntry.employeeName ||
      !newEntry.hours ||
      !newEntry.activity
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: newEntry.employeeId,
          employeeName: newEntry.employeeName,
          date: newEntry.date,
          hours: parseFloat(newEntry.hours),
          activity: newEntry.activity,
        }),
      });

      if (!res.ok) {
        console.error("❌ Failed to add entry:", await res.text());
        return;
      }

      const created = await res.json();
      const normalized: WorkEntry = {
        id: String(created.id ?? created._id ?? Date.now()),
        employeeId: created.employeeId,
        employeeName: created.employeeName,
        date: created.date ?? newEntry.date,
        hours:
          typeof created.hours === "number"
            ? created.hours
            : Number(created.hours) || 0,
        activity: created.activity ?? newEntry.activity,
        overtime:
          typeof created.overtime === "boolean"
            ? created.overtime
            : (Number(created.hours) || 0) > 8,
      };

      setWorkEntries((prev) => [normalized, ...prev]);
      setNewEntry({
        employeeId: "",
        employeeName: "",
        date: new Date().toISOString().split("T")[0],
        hours: "",
        activity: "",
      });
    } catch (err) {
      console.error("Error adding entry:", err);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkEntries((prev) => prev.filter((entry) => entry.id !== id));
      } else {
        console.error("Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  // ✅ Stats
  const totalHours = workEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const overtimeHours = workEntries
    .filter((entry) => entry.overtime)
    .reduce((sum, entry) => sum + (entry.hours - 8), 0);

  // ✅ PDF Export
  const generateReport = () => {
    if (workEntries.length === 0) {
      alert("No work entries to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FarmHub - Work Hours Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Employee", "Date", "Hours", "Activity", "Status"];
    const tableRows = workEntries.map((e) => [
      e.employeeName,
      new Date(e.date).toLocaleDateString(),
      `${e.hours}h`,
      e.activity,
      e.overtime ? "Overtime" : "Regular",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save("work_hours_report.pdf");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Work Hours</h1>
            <p className="text-muted-foreground">
              Track daily work hours and activities
            </p>
          </div>
        </div>

        <Button
          onClick={generateReport}
          className="bg-gradient-farm hover:opacity-90 shadow-farm"
        >
          <FileDown className="w-4 h-4 mr-2" /> Generate Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-farm-green" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-farm-brown" />
              <div>
                <p className="text-sm text-muted-foreground">Active Workers</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(workEntries.map((e) => e.employeeName)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-farm-yellow" />
              <div>
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
                <p className="text-2xl font-bold text-foreground">
                  {overtimeHours.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Log Work Hours
          </CardTitle>
          <CardDescription>
            Record work hours for farm employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={newEntry.employeeName}
                onValueChange={(value) => {
                  const emp = employeeOptions.find((e) => e.name === value);
                  setNewEntry({
                    ...newEntry,
                    employeeId: emp?._id || "",
                    employeeName: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No employees
                    </div>
                  ) : (
                    employeeOptions.map((emp) => (
                      <SelectItem key={emp._id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEntry.date}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={newEntry.hours}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, hours: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                value={newEntry.activity}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, activity: e.target.value })
                }
                placeholder="Enter activity"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={addWorkEntry}
                className="w-full bg-gradient-farm hover:opacity-90 shadow-farm"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Work Entries</CardTitle>
          <CardDescription>
            View and manage recorded work hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Hours</th>
                  <th className="text-left py-3 px-4">Activity</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">{entry.employeeName}</td>
                    <td className="py-3 px-4">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{entry.hours}h</td>
                    <td className="py-3 px-4">{entry.activity}</td>
                    <td className="py-3 px-4">
                      {entry.overtime ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-farm-yellow/20 text-farm-brown">
                          Overtime
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-farm-green/20 text-farm-green">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {workEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No work entries recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
