const express = require("express");
const router = express.Router();
const {
  createRefund,
  getAllRefunds,
  getRefundsByCustomer,
  processRefund,
  markCouponAsUsed,
  deleteRefund
} = require("../../controllers/Customer/refundController");

// POST /api/refunds - Create a new refund request
router.post("/", createRefund);

// GET /api/refunds - Get all refunds (admin only)
router.get("/", getAllRefunds);

// GET /api/refunds/customer/:customerId - Get refunds by customer ID
router.get("/customer/:customerId", getRefundsByCustomer);

// PUT /api/refunds/:refundId/process - Process refund (approve/reject)
router.put("/:refundId/process", processRefund);

// PUT /api/refunds/:refundId/use-coupon - Mark coupon as used
router.put("/:refundId/use-coupon", markCouponAsUsed);

// DELETE /api/refunds/:refundId - Delete a refund request
router.delete("/:refundId", deleteRefund);

module.exports = router;