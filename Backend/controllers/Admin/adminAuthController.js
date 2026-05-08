const Admin = require("../../models/Admin/Admin");
const jwt = require("jsonwebtoken");

// Helper to generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// @desc    Register a new admin (for setup via Postman)
// @route   POST /api/admin/auth/register
exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if admin already exists
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create admin with role (defaults to 'superadmin' if not provided)
    const { role } = req.body;
    const admin = await Admin.create({ name, email, password, role: role || "superadmin" });
    
    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login admin
// @route   POST /api/admin/auth/login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    
    // Verify admin exists, password matches, and role is admin or superadmin
    if (admin && (await admin.matchPassword(password)) && (admin.role === "admin" || admin.role === "superadmin")) {
      return res.json({
        message: "Login successful",
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        token: generateToken(admin._id, admin.role),
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update admin profile (email/password)
// @route   PUT /api/admin/auth/profile
exports.updateAdminProfile = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const adminId = req.admin && req.admin._id;
    if (!adminId) return res.status(401).json({ message: "Not authorized" });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update email if provided and different
    if (email && email !== admin.email) {
      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      admin.email = email;
    }

    // Update password when newPassword provided — require currentPassword
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      admin.password = newPassword; // will be hashed by pre-save middleware
    }

    await admin.save();

    // Return updated user (without password) and a fresh token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
