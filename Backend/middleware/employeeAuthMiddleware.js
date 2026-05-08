const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee/Employee");

// Middleware to protect employee routes and attach employee to req.employee
const protectEmployee = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const employee = await Employee.findById(decoded.id).select("-password");
      
      if (!employee) {
        return res.status(401).json({ message: "Not authorized - employee not found" });
      }

      // Check if employee is active
      if (employee.status !== 'Active') {
        return res.status(401).json({ message: "Employee account is inactive" });
      }

      req.employee = employee;
      req.user = employee; // Also set req.user for compatibility
      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (error) {
    console.error("Employee auth middleware error:", error);
    return res.status(401).json({ message: "Not authorized - token invalid" });
  }
};

module.exports = { protectEmployee };