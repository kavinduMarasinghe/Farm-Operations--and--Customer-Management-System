const express = require("express");
const { protectEmployee } = require("../../middleware/employeeAuthMiddleware");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSalary,
} = require("../../controllers/Employee/employeeController.js");

const router = express.Router();

// CRUD only (login handled by authRoutes.js)
router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

// Salary calculation for specific employee (temporarily public for testing)
router.get("/:id/salary", getEmployeeSalary);

module.exports = router;
