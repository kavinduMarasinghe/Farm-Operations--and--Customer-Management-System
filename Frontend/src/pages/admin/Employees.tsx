import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"

type Employee = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: "Worker" | "Supervisor" | "Driver" | "Admin";
  isActive?: boolean;              // frontend convenience
  status?: "Active" | "Inactive";  // backend field
  password?: string;               // ✅ new
  lastLogin?: string;              // ✅ last login timestamp
};

const API = "http://localhost:8070/api";

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Employee>({
    name: "",
    email: "",
    phone: "",
    role: "Worker",
    isActive: true,
    password: "",
  });

  const normalizeList = (payload: unknown): Employee[] => {
    const raw = Array.isArray(payload) ? payload : (payload as any)?.data ?? [];
    return (Array.isArray(raw) ? raw : []).map((e: any) => ({
      ...e,
      isActive: typeof e?.isActive === "boolean" ? e.isActive : e?.status === "Active",
    }));
  };

  const load = () => {
    setLoading(true);
    fetch(`${API}/employees`)
      .then(r => r.json())
      .then((data) => setRows(normalizeList(data)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(e =>
      [e.name, e.email, e.phone, e.role].filter(Boolean).some(v => String(v).toLowerCase().includes(k))
    );
  }, [rows, q]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", role: "Worker", isActive: true, password: "" });
    setOpen(true);
  };

  const startEdit = (e: Employee) => {
    setEditingId((e._id || e.id) ?? null);
    setForm({
      name: e.name ?? "",
      email: e.email ?? "",
      phone: e.phone ?? "",
      role: (e.role as Employee["role"]) ?? "Worker",
      isActive: typeof e.isActive === "boolean" ? e.isActive : e.status === "Active",
      password: "", // don’t preload password
    });
    setOpen(true);
  };

  const save = () => {
    const id = editingId;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/employees/${id}` : `${API}/employees`;

    const body: any = {
      ...form,
      status: form.isActive ? "Active" : "Inactive",
    };

    // ✅ If editing, don’t send empty password unless you want reset
    if (id && !body.password) {
      delete body.password;
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        setOpen(false);
        load();
      })
      .catch((e) => alert(e?.message || "Save failed"));
  };

  const del = (e: Employee) => {
    const id = e._id || e.id;
    if (!id) return;
    fetch(`${API}/employees/${id}`, { method: "DELETE" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        load();
      })
      .catch((err) => alert(err?.message || "Delete failed"));
  };

  const generateEmployeeReport = () => {
    if (rows.length === 0) {
      alert("No employees to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FarmHub - Employee Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Name", "Role", "Phone", "Email", "Last Login"];
    const tableRows = rows.map((e) => [
      e.name,
      e.role ?? "—",
      e.phone ?? "—",
      e.email ?? "—",
      e.lastLogin 
        ? new Date(e.lastLogin).toLocaleDateString() + " " + new Date(e.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : "Never",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: { fillColor: [22, 163, 74] },
    });

    const loggedInCount = rows.filter((e) => e.lastLogin).length;
    const neverLoggedInCount = rows.length - loggedInCount;
    doc.text(
      `Total Employees: ${rows.length}   •   Have Logged In: ${loggedInCount}   •   Never Logged In: ${neverLoggedInCount}`,
      14,
      (doc as any).lastAutoTable.finalY + 10
    );

    doc.save("employee_report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Add, update, and remove employees</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Manage Employees</CardTitle>
            <CardDescription>{rows.length} total</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search name, email, phone..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button onClick={startCreate}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
            <Button onClick={generateEmployeeReport} className="bg-gradient-farm hover:opacity-90 shadow-farm">
              Generate Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Phone</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Last Login</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-6 text-muted-foreground" colSpan={6}>Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td className="py-6 text-muted-foreground" colSpan={6}>No employees</td></tr>
              )}
              {filtered.map((e) => (
                <tr key={(e._id || e.id) as string} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">{e.name}</td>
                  <td className="py-2 pr-2">{e.role ?? "—"}</td>
                  <td className="py-2 pr-2">{e.phone ?? "—"}</td>
                  <td className="py-2 pr-2">{e.email ?? "—"}</td>
                  <td className="py-2 pr-2">
                    {e.lastLogin 
                      ? new Date(e.lastLogin).toLocaleDateString() + " " + new Date(e.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : "Never"
                    }
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="secondary" size="sm" className="mr-2" onClick={() => startEdit(e)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => del(e)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>Fill the form and save.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={form.role ?? "Worker"} onValueChange={(v) => setForm({ ...form, role: v as Employee["role"] })}>
                <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Worker">Worker</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            {/* ✅ Password Field */}
            {!editingId && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password ?? ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <Switch id="isActive" checked={!!form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
