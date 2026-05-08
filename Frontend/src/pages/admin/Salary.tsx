import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Employee {
  _id: string;
  name: string;
  role: string;
  hourlyRate?: number;
}

interface Timesheet {
  _id?: string;
  employeeName: string;
  date: string;
  hours: number;
}

const ROLE_RATES: Record<string, number> = {
  Worker: 250,
  Supervisor: 1000,
  Driver: 500,
};

export default function Salary() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      fetch("http://localhost:8070/api/employees").then((r) => r.json()),
      fetch("http://localhost:8070/api/timesheets").then((r) => r.json()),
    ])
      .then(([emps, sheets]) => {
        setEmployees(Array.isArray(emps) ? emps : []);
        setTimesheets(Array.isArray(sheets) ? sheets : []);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate hours by employee name (the timesheets use employeeName)
  // Tolerant aggregation: normalize and token-match timesheet.employeeName to employee.name
  const normalizeToTokens = (s: string | undefined) => {
    if (!s) return [] as string[];
    const cleaned = String(s).toLowerCase().trim();
    // split on common separators (space, @, dot, underscore, dash)
    return cleaned.split(/[@._\-\s]+/).filter(Boolean);
  };

  // Precompute employee token sets
  const empTokens: Record<string, string[]> = {};
  for (const e of employees) {
    empTokens[e._id] = normalizeToTokens(e.name);
  }

  const hoursByEmployee: Record<string, number> = {};

  timesheets.forEach((t) => {
    const sheetTokens = normalizeToTokens(t.employeeName);
    // try to find a matching employee by token intersection
    let matchedId: string | null = null;
    for (const e of employees) {
      const tokens = empTokens[e._id] || [];
      if (tokens.length === 0 || sheetTokens.length === 0) continue;
      // if any token equals or contains the other token, treat as match
      const match = tokens.some((et) => sheetTokens.some((st) => et === st || et.includes(st) || st.includes(et)));
      if (match) {
        matchedId = e._id;
        break;
      }
    }

    if (matchedId) {
      hoursByEmployee[matchedId] = (hoursByEmployee[matchedId] || 0) + (Number(t.hours) || 0);
    } else {
      // fallback: aggregate by raw name to avoid losing data
      const raw = t.employeeName || "Unknown";
      hoursByEmployee[raw] = (hoursByEmployee[raw] || 0) + (Number(t.hours) || 0);
    }
  });

  // Build rows
  const rows = employees.map((e) => {
    // hoursByEmployee is keyed by employee._id for matched timesheets; fallback to name-keyed aggregation
    const hours = hoursByEmployee[e._id] ?? hoursByEmployee[e.name] ?? 0;
    const role = e.role || "Worker";
    const rate = ROLE_RATES[role] ?? ROLE_RATES.Worker;
    const totalSalary = hours * rate;
    const epf8 = (totalSalary * 8) / 100;
    const epf12 = (totalSalary * 12) / 100;
    const totalEpf = epf8 + epf12;
    const etf = (totalSalary * 3) / 100;
    const monthlySalary = totalSalary - totalEpf;

    return {
      id: e._id,
      name: e.name,
      role,
      hours,
      rate,
      totalSalary,
      epf8,
      epf12,
      totalEpf,
      etf,
      monthlySalary,
    };
  });

  const currency = (v: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(v);

  const generateCSV = () => {
    const headers = [
      "Employee Name",
      "Role",
      "Hours",
      "EPF (8%)",
      "EPF (12%)",
      "Total EPF",
      "ETF (3%)",
      "Monthly Salary",
    ];

    const lines = [headers.join(",")];

    for (const r of rows) {
      const line = [
        `"${r.name}"`,
        r.role,
        String(r.hours),
        String(r.epf8.toFixed(2)),
        String(r.epf12.toFixed(2)),
        String(r.totalEpf.toFixed(2)),
        String(r.etf.toFixed(2)),
        String(r.monthlySalary.toFixed(2)),
      ].join(",");
      lines.push(line);
    }

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-report-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Salary</h1>
            <p className="text-muted-foreground">Monthly salary calculations based on work hours and roles. Amounts shown in LKR.</p>
          </div>
        </div>

        <div>
          <Button onClick={() => generateCSV()} className="bg-gradient-farm hover:opacity-90 shadow-farm">
            <FileDown className="w-4 h-4 mr-2" /> Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Table</CardTitle>
          <CardDescription>
            Breakdown of salaries and EPF/ETF calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Employee Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Hours</th>
                  <th className="text-left py-3 px-4">EPF (8%)</th>
                  <th className="text-left py-3 px-4">EPF (12%)</th>
                  <th className="text-left py-3 px-4">Total EPF</th>
                  <th className="text-left py-3 px-4">ETF (3%)</th>
                  <th className="text-left py-3 px-4 text-emerald-600">Monthly Salary</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{r.name}</td>
                    <td className="py-3 px-4">{r.role}</td>
                    <td className="py-3 px-4">{r.hours}</td>
                    <td className="py-3 px-4">{currency(r.epf8)}</td>
                    <td className="py-3 px-4">{currency(r.epf12)}</td>
                    <td className="py-3 px-4">{currency(r.totalEpf)}</td>
                    <td className="py-3 px-4">{currency(r.etf)}</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">{currency(r.monthlySalary)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">No employees found</td>
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
