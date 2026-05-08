// src/pages/EmployeeProfile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/api/apiClient";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Edit2,
  Save,
  X,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EmployeeProfile() {
  const { user } = useAuth();
  
  // Debug: Log user data
  console.log('EmployeeProfile - Current user:', user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    joinDate: "",
    department: "",
    role: "",
  });

  // ✅ Use normalized id from AuthContext
  const storageKey = () => `profile_${user?.id ?? user?.email ?? "guest"}`;

  useEffect(() => {
    if (!user) {
      // fallback when no user
      setProfileData({
        name: "Guest",
        email: "",
        phone: "",
        address: "",
        joinDate: "",
        department: "",
        role: "—",
      });
      return;
    }

    const savedProfile = localStorage.getItem(storageKey());
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    } else {
      const defaults = {
        name: user.email ? user.email.split("@")[0] : "Guest",
        email: user.email || "",
        phone: "+1 (555) 123-4567",
        address: "123 Farm Road, Rural County",
        joinDate: "2024-01-15",
        department: "Field Operations",
        role: user.role === "employee" ? "Worker" : user.role || "—",
      };
      setProfileData(defaults);
      localStorage.setItem(storageKey(), JSON.stringify(defaults));
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem(storageKey(), JSON.stringify(profileData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    const savedProfile = localStorage.getItem(storageKey());
    if (savedProfile) setProfileData(JSON.parse(savedProfile));
    setIsEditing(false);
  };

  // Safely compute initials and join date
  const initials = profileData.name?.trim()
    ? profileData.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ME";

  const joinDateLabel = profileData.joinDate
    ? (() => {
        const d = new Date(profileData.joinDate);
        return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
      })()
    : "—";

  // Salary data is now fetched from admin's calculation system

  const [salaryInfo, setSalaryInfo] = useState({
    hours: 0,
    rate: 0,
    basicSalary: 0,
    totalSalary: 0,
    epf8: 0,
    epf12: 0,
    totalEpf: 0,
    etf: 0,
    overtimeBonus: 0,
    attendanceBonus: 0,
    totalBonus: 0,
    monthlySalary: 0,
  });

  useEffect(() => {
    if (!user?.id) return;

    // Fetch salary calculation from admin's salary calculation system
    apiClient.get(`/api/employees/${user.id}/salary`)
      .then((response) => {
        const data = response.data;
        if (data.salary) {
          setSalaryInfo({
            hours: data.salary.hours || 0,
            rate: data.salary.rate || 0,
            basicSalary: data.salary.basicSalary || 0,
            totalSalary: data.salary.grossSalary || 0,
            epf8: data.salary.epf8 || 0,
            epf12: data.salary.epf12 || 0,
            totalEpf: data.salary.totalEpf || 0,
            etf: data.salary.etf || 0,
            overtimeBonus: data.salary.overtimeBonus || 0,
            attendanceBonus: data.salary.attendanceBonus || 0,
            totalBonus: data.salary.totalBonus || 0,
            monthlySalary: data.salary.netSalary || 0,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch salary:", err);
        setSalaryInfo({
          hours: 0,
          rate: 0,
          basicSalary: 0,
          totalSalary: 0,
          epf8: 0,
          epf12: 0,
          totalEpf: 0,
          etf: 0,
          overtimeBonus: 0,
          attendanceBonus: 0,
          totalBonus: 0,
          monthlySalary: 0,
        });
      });
  }, [user?.id]);

  // PDF Generation Function
  const generateSalaryPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY STATEMENT", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("FarmerHub - Employee Payroll", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 20;

    // Employee Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE INFORMATION", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${profileData.name || "—"}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Email: ${profileData.email || "—"}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Department: ${profileData.department || "—"}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Role: ${profileData.role || "—"}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Join Date: ${joinDateLabel}`, margin, yPosition);
    yPosition += 20;

    // Salary Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY BREAKDOWN", margin, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Description", margin, yPosition);
    doc.text("Amount (LKR)", pageWidth - margin - 60, yPosition);
    yPosition += 5;

    // Table line
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Table data
    doc.setFont("helvetica", "normal");
    const role = profileData.role || "Worker";
    const rate = salaryInfo.rate;
    const basicSalary = salaryInfo.basicSalary;
    
    // Enhanced salary breakdown
    const entries = [
      [`Total Hours Worked`, `${salaryInfo.hours}`],
      [`Hourly Rate (${role})`, `${rate.toLocaleString()}`],
      [`Basic Salary`, `${basicSalary.toLocaleString()}`],
      [``, ``], // Empty row
      [`BONUSES:`, ``],
      [`Overtime Bonus`, `${salaryInfo.overtimeBonus.toLocaleString()}`],
      [`Attendance Bonus`, `${salaryInfo.attendanceBonus.toLocaleString()}`],
      [`Total Bonuses`, `${salaryInfo.totalBonus.toLocaleString()}`],
      [``, ``], // Empty row
      [`GROSS SALARY`, `${salaryInfo.totalSalary.toLocaleString()}`],
      [``, ``], // Empty row
      [`DEDUCTIONS:`, ``],
      [`EPF (Employee 8%)`, `${salaryInfo.epf8.toLocaleString()}`],
      [`EPF (Employer 12%)`, `${salaryInfo.epf12.toLocaleString()}`],
      [`ETF (3%)`, `${salaryInfo.etf.toLocaleString()}`],
      [`Total Deductions`, `${salaryInfo.totalEpf.toLocaleString()}`],
      [``, ``], // Empty row
      [`NET PAYABLE SALARY`, `${salaryInfo.monthlySalary.toLocaleString()}`],
    ];

    entries.forEach(([desc, amount]) => {
      if (desc === "" && amount === "") {
        yPosition += 5; // Empty row spacing
        return;
      }
      
      if (desc === "BONUSES:" || desc === "DEDUCTIONS:" || desc === "GROSS SALARY") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
      } else if (desc === "NET PAYABLE SALARY") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        // Add a background rectangle for net salary
        doc.setFillColor(240, 248, 255);
        doc.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, 10, 'F');
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      
      doc.text(desc, margin, yPosition);
      if (amount) {
        doc.text(amount, pageWidth - margin - 60, yPosition);
      }
      yPosition += 7;
    });

    // Footer
    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, margin, yPosition + 5);
    
    yPosition += 20;
    doc.text("This is a system-generated document.", pageWidth / 2, yPosition, { align: "center" });

    // Save the PDF
    const fileName = `salary_statement_${profileData.name?.replace(/\s+/g, '_') || 'employee'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Guard for when no user is logged in
  if (!user) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Not logged in</h2>
        <p className="text-muted-foreground">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 pr-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-farm rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information
            </p>
          </div>
        </div>

        {!isEditing ? (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-farm hover:opacity-90"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              onClick={() => window.location.href = '/employee/settings'}
              variant="outline"
            >
              Settings
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="bg-gradient-farm hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-farm text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {profileData.name || "—"}
              </CardTitle>
              <CardDescription className="text-lg">
                {profileData.role || "—"} • {profileData.department || "—"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Personal Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.name || "—"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.email || "—"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.phone || "—"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({ ...profileData, address: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.address || "—"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Work Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="role">Job Role</Label>
                {isEditing ? (
                  <Input
                    id="role"
                    value={profileData.role}
                    onChange={(e) =>
                      setProfileData({ ...profileData, role: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.role || "—"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        department: e.target.value,
                      })
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData.department || "—"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Join Date</Label>
                <div className="flex items-center gap-2 py-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{joinDateLabel}</span>
                </div>
              </div>

              {/* Salary Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Salary</Label>
                  <Button
                    onClick={generateSalaryPDF}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download PDF
                  </Button>
                </div>
                <div className="py-2 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Hours:</span>
                    <span className="font-medium">{salaryInfo.hours}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Basic Salary:</span>
                    <span className="font-medium">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.basicSalary)}</span>
                  </div>
                  {salaryInfo.totalBonus > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Bonuses:</span>
                      <span className="font-medium text-green-600">+{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.totalBonus)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Gross Salary:</span>
                    <span className="font-medium">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.totalSalary)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">EPF (8%):</span>
                    <span className="font-medium text-red-600">-{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.epf8)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">ETF (3%):</span>
                    <span className="font-medium text-red-600">-{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.etf)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">Net Payable:</span>
                      <span className="font-bold text-green-600">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(salaryInfo.monthlySalary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
