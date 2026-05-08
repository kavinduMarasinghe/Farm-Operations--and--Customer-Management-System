// src/pages/EmployeeWorkHours.tsx
import { useState, useEffect } from "react";
import { Clock, Plus, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface WorkEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  activity: string;
  overtime: boolean;
}

export default function EmployeeWorkHours() {
  const { user, token } = useAuth();
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    activity: "",
  });

  const API =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8070";
  const TS_URL = `${API}/api/timesheets`;

  const activities = [
    "Crop Planting",
    "Crop Harvesting",
    "Equipment Maintenance",
    "Livestock Care",
    "Field Preparation",
    "Irrigation Management",
    "Pest Control",
    "General Farm Work",
  ];

  // ---------- Helpers ----------
  const toKey = (v: unknown) =>
    (v === undefined || v === null ? "" : String(v)).trim().toLowerCase();

  // Calculate duration from times
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, eh + (em || 0) / 60 - (sh + (sm || 0) / 60));
  };

  // ---------- Load employee + fetch my timesheets ----------
  useEffect(() => {
    if (!user || !token) {
      console.warn("⚠️ No valid auth found");
      return;
    }

    try {
      const myId = toKey((user as any)?.id ?? (user as any)?._id);
      const myEmail = toKey(user?.email);
      const myName = toKey((user as any)?.name ?? (user as any)?.fullName);

      fetch(TS_URL)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
          return r.json();
        })
        .then((rows) => {
          const arr: any[] = Array.isArray(rows) ? rows : [];

          // Strong matching: accept any of these shapes
          const mine = arr.filter((r) => {
            const vals: string[] = [];

            const push = (v: unknown) => {
              const k = toKey(v);
              if (k) vals.push(k);
            };

            // Variants we might receive from backend
            push(r?.employeeId?._id);
            push(r?.employeeId?.id);
            push(r?.employeeId); // could be plain string ObjectId or email/name
            push(r?.employee?._id);
            push(r?.employee?.id);
            push(r?.employee?.email);
            push(r?.employee?.name);
            push(r?.employeeEmail);
            push(r?.employeeName);

            const targets = [myId, myEmail, myName].filter(Boolean);
            return vals.some((v) => targets.includes(v));
          });

          const normalized: WorkEntry[] = mine
            .map((r) => {
              const hours =
                typeof r?.hours === "number"
                  ? r.hours
                  : Number(r?.hours) || 0;

              return {
                id: String(r?.id ?? r?._id ?? ""),
                date:
                  r?.date ??
                  r?.createdAt ??
                  new Date().toISOString(),
                startTime: r?.startTime ?? "",
                endTime: r?.endTime ?? "",
                hours,
                activity: r?.activity ?? "General Farm Work",
                overtime:
                  typeof r?.overtime === "boolean"
                    ? r.overtime
                    : hours > 8,
              } as WorkEntry;
            })
            .sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

          setWorkEntries(normalized);
        })
        .catch((err) => console.error("❌ Failed to load timesheets:", err));
    } catch (e) {
      console.error("❌ useEffect error in WorkHours:", e);
    }
  }, [TS_URL, user, token]);

  // ---------- Create new entry (employee self-logging) ----------
  const addWorkEntry = async () => {
    if (!user) return;
    if (!newEntry.startTime || !newEntry.endTime || !newEntry.activity) return;

    const hours = calculateHours(newEntry.startTime, newEntry.endTime);
    const empName =
      user?.name || user?.fullName || user?.email || "Employee";

    try {
      const res = await fetch(TS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: (user as any)?.id ?? (user as any)?._id,
          employeeName: empName,
          employeeEmail: user?.email,
          date: newEntry.date,
          startTime: newEntry.startTime,
          endTime: newEntry.endTime,
          hours,
          activity: newEntry.activity,
        }),
      });

      if (!res.ok) {
        console.error("❌ Create timesheet failed:", await res.text());
        return;
      }

      const created = await res.json();
      const createdRow: WorkEntry = {
        id: String(created?.id ?? created?._id ?? Date.now()),
        date: created?.date ?? newEntry.date,
        startTime: created?.startTime ?? newEntry.startTime,
        endTime: created?.endTime ?? newEntry.endTime,
        hours:
          typeof created?.hours === "number" ? created.hours : hours,
        activity: created?.activity ?? newEntry.activity,
        overtime:
          typeof created?.overtime === "boolean"
            ? created.overtime
            : (typeof created?.hours === "number"
                ? created.hours
                : hours) > 8,
      };

      setWorkEntries((prev) => [createdRow, ...prev]);

      setNewEntry({
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        activity: "",
      });
    } catch (e) {
      console.error("❌ Error creating timesheet:", e);
    }
  };

  // ---------- Analytics ----------
  const thisWeekEntries = workEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  const totalHoursThisWeek = thisWeekEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0
  );

  const overtimeHours = thisWeekEntries
    .filter((entry) => entry.overtime)
    .reduce((sum, entry) => sum + Math.max(0, entry.hours - 8), 0);

  const avgDailyHours =
    thisWeekEntries.length > 0
      ? totalHoursThisWeek / thisWeekEntries.length
      : 0;

  // ---------- UI ----------
  return (
    <div className="w-full min-h-screen p-6 pr-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 bg-gradient-farm rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            My Work Hours
          </h1>
          <p className="text-muted-foreground">
            Track your daily work hours and activities
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-farm-green" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalHoursThisWeek.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-farm-brown" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Daily Average
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {avgDailyHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-farm-yellow" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Overtime Hours
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {overtimeHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-farm-green-light" />
              <div>
                <p className="text-sm text-muted-foreground">Days Worked</p>
                <p className="text-2xl font-bold text-foreground">
                  {thisWeekEntries.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Hours Form removed per request */}

      {/* Recent Entries */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Work Entries</CardTitle>
        <CardDescription>Your logged work hours and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Hours
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Activity
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {workEntries.slice(0, 10).map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {entry.hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {entry.activity}
                    </td>
                    <td className="py-3 px-4">
                      {entry.overtime ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-farm-yellow/20 text-farm-brown">
                          Overtime
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-farm-green/20 text-farm-green">
                          Regular
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {workEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 px-4 text-center text-muted-foreground"
                    >
                      No work entries logged yet
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
