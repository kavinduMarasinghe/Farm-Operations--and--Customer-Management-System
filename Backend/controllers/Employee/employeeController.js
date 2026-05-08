const bcrypt = require("bcryptjs");
const Employee = require("../../models/Employee/Employee.js");
const User = require("../../models/Employee/User.js");

// ✅ GET /api/employees
const getEmployees = async (_req, res) => {
  try {
    const list = await Employee.find().sort({ createdAt: -1 });
    res.json(
      list.map((e) => ({
        _id: e._id.toString(),
        id: e._id.toString(),
        name: e.name,
        email: e.email,
        phone: e.phone,
        role: e.role,
        isActive: e.status === "Active",
        status: e.status,
        hourlyRate: e.hourlyRate,
        lastLogin: e.lastLogin,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees", error: err });
  }
};

// ✅ POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const data = req.body ?? {};

    if (!data.password || data.password.length < 6) {
      return res.status(400).json({ message: "Password is required (min 6 chars)" });
    }

    if (typeof data.isActive === "boolean") {
      data.status = data.isActive ? "Active" : "Inactive";
      delete data.isActive;
    }

    // 1️⃣ Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // 2️⃣ Create Employee
    const employee = await Employee.create(data);

    // 3️⃣ Create corresponding User
    await User.create({
      email: data.email,
      password: data.password, // pre-save hook will hash
      role: "employee",
    });

    res.status(201).json({
      _id: employee._id.toString(),
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.status === "Active",
      status: employee.status,
      hourlyRate: employee.hourlyRate,
      lastLogin: employee.lastLogin,
    });
  } catch (err) {
    res.status(400).json({ message: "Error creating employee", error: err });
  }
};

// ✅ PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const data = { ...req.body };

    if (typeof data.isActive === "boolean") {
      data.status = data.isActive ? "Active" : "Inactive";
      delete data.isActive;
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // update employee record
    Object.assign(employee, data);
    await employee.save();

    // sync user record
    const updateData = { role: "employee" };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    await User.findOneAndUpdate({ email: employee.email }, updateData);

    res.json({
      _id: employee._id.toString(),
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.status === "Active",
      status: employee.status,
      hourlyRate: employee.hourlyRate,
      lastLogin: employee.lastLogin,
    });
  } catch (err) {
    res.status(400).json({ message: "Error updating employee", error: err });
  }
};

// ✅ DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await User.findOneAndDelete({ email: employee.email });

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting employee", error: err });
  }
};

// ✅ POST /api/auth/employee/login - Employee login
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user first
    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'employee') {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Find employee details
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ message: "Employee profile not found" });
    }

    // Check if employee is active
    if (employee.status !== 'Active') {
      return res.status(401).json({ message: "Employee account is inactive" });
    }

    // Update lastLogin
    employee.lastLogin = new Date();
    await employee.save();

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: employee._id.toString(),
        email: employee.email,
        role: 'employee' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: 'employee',
        employeeRole: employee.role,
      }
    });
  } catch (err) {
    console.error('Employee login error:', err);
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// ✅ PUT /api/employee/profile - Update own profile (for logged-in employee)
const updateEmployeeProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const employeeId = req.employee.id || req.employee._id;

    console.log('Profile update request for employee:', employeeId);
    console.log('Request body:', { name, email, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // If updating password, verify current password first
    if (currentPassword && newPassword) {
      const user = await User.findOne({ email: employee.email }).select('+password');
      if (!user) {
        return res.status(404).json({ message: "User account not found" });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password in User model
      user.password = newPassword; // Pre-save hook will hash it
      await user.save();
      console.log('Password updated for user:', user.email);
    }

    // Update employee profile
    if (name) employee.name = name;
    if (email && email !== employee.email) {
      // If email is changing, update the User model too
      const user = await User.findOne({ email: employee.email });
      if (user) {
        user.email = email;
        await user.save();
      }
      employee.email = email;
    }

    await employee.save();
    console.log('Employee profile updated:', employee._id);

    res.json({
      success: true,
      message: "Profile updated successfully",
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ message: "Error updating profile", error: err.message });
  }
};

// ✅ GET /api/employees/:id/salary - Calculate salary for specific employee
const getEmployeeSalary = async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get timesheets for this employee
    const Timesheet = require("../../models/Employee/Timesheet.js");
    const timesheets = await Timesheet.find();

    // Role rates (same as admin calculation)
    const ROLE_RATES = {
      Worker: 250,
      Supervisor: 1000,
      Driver: 500,
    };

    // Normalize employee name to tokens for matching
    const normalizeToTokens = (s) => {
      if (!s) return [];
      const cleaned = String(s).toLowerCase().trim();
      return cleaned.split(/[@._\-\s]+/).filter(Boolean);
    };

    const empTokens = normalizeToTokens(employee.name);
    
    // Calculate total hours from timesheets
    let totalHours = 0;
    timesheets.forEach((t) => {
      const sheetTokens = normalizeToTokens(t.employeeName);
      
      // Check if timesheet matches this employee
      const match = empTokens.some((et) => 
        sheetTokens.some((st) => et === st || et.includes(st) || st.includes(et))
      );
      
      if (match) {
        totalHours += Number(t.hours) || 0;
      }
    });

    // Calculate salary using same logic as admin
    const role = employee.role || "Worker";
    const rate = ROLE_RATES[role] ?? ROLE_RATES.Worker;
    const basicSalary = totalHours * rate;
    
    // Calculate bonuses (same as employee profile logic)
    const overtimeBonus = totalHours > 160 ? (totalHours - 160) * rate * 0.5 : 0;
    const attendanceBonus = totalHours >= 160 ? 5000 : 0;
    const totalBonus = overtimeBonus + attendanceBonus;
    
    const grossSalary = basicSalary + totalBonus;
    const epf8 = (grossSalary * 8) / 100;
    const epf12 = (grossSalary * 12) / 100;
    const totalEpf = epf8 + epf12;
    const etf = (grossSalary * 3) / 100;
    const netSalary = grossSalary - totalEpf;

    res.json({
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
      salary: {
        hours: totalHours,
        rate: rate,
        basicSalary: basicSalary,
        overtimeBonus: overtimeBonus,
        attendanceBonus: attendanceBonus,
        totalBonus: totalBonus,
        grossSalary: grossSalary,
        epf8: epf8,
        epf12: epf12,
        totalEpf: totalEpf,
        etf: etf,
        netSalary: netSalary,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error calculating salary", error: err });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  loginEmployee,
  updateEmployeeProfile,
  getEmployeeSalary
};
