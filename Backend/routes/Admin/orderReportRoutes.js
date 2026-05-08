// routes/Admin/orderReportRoutes.js
const express = require("express");
const { getOrderReport } = require("../../controllers/Admin/orderReportController");

const router = express.Router();

// Reports endpoint
router.get("/orders", getOrderReport);

module.exports = router;
