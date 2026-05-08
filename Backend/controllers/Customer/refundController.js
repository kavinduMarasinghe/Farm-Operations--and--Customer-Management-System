const Refund = require("../../models/Customer/Refund");

// Create a new refund request
const createRefund = async (req, res) => {
  try {
    const { orderId, customerId, amount, message, orderDetails } = req.body;

    // Validate required fields
    if (!orderId || !customerId || !amount || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Check if refund already exists for this order
    const existingRefund = await Refund.findOne({ orderId });
    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: "A refund request already exists for this order"
      });
    }

    // Create new refund
    const refund = new Refund({
      orderId,
      customerId,
      amount,
      message,
      orderDetails,
      status: "pending"
    });

    const savedRefund = await refund.save();

    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      data: savedRefund
    });

  } catch (error) {
    console.error("Create refund error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all refunds (admin only)
const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate('orderId', 'date status')
      .populate('customerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: refunds
    });

  } catch (error) {
    console.error("Get all refunds error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get refunds by customer ID
const getRefundsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { availableOnly } = req.query; // Optional query param to filter unused coupons

    let query = { customerId };
    
    // If requesting available coupons only, filter out used ones
    if (availableOnly === 'true') {
      query = {
        customerId,
        status: 'approved',
        isUsedAsCoupon: { $ne: true } // Not used as coupon
      };
    }

    const refunds = await Refund.find(query)
      .populate('orderId', 'date status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: refunds
    });

  } catch (error) {
    console.error("Get customer refunds error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Process refund (approve/reject)
const processRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const { status, adminResponse, adminId } = req.body;

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    // Find and update refund
    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found"
      });
    }

    if (refund.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Refund request has already been processed"
      });
    }

    // Update refund
    refund.status = status;
    refund.adminResponse = adminResponse || "";
    refund.processedAt = new Date();
    refund.processedBy = adminId || "admin";

    const updatedRefund = await refund.save();

    res.status(200).json({
      success: true,
      message: `Refund request ${status} successfully`,
      data: updatedRefund
    });

  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Mark a refund as used when applied as coupon
const markCouponAsUsed = async (req, res) => {
  try {
    const { refundId } = req.params;
    const { orderId } = req.body;

    if (!refundId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Refund ID and Order ID are required"
      });
    }

    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found"
      });
    }

    if (refund.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Only approved refunds can be used as coupons"
      });
    }

    if (refund.isUsedAsCoupon) {
      return res.status(400).json({
        success: false,
        message: "This coupon has already been used"
      });
    }

    // Mark as used
    refund.isUsedAsCoupon = true;
    refund.usedInOrderId = orderId;
    refund.usedAt = new Date();

    await refund.save();

    res.status(200).json({
      success: true,
      message: "Coupon marked as used successfully",
      data: refund
    });

  } catch (error) {
    console.error("Mark coupon as used error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete a refund request
const deleteRefund = async (req, res) => {
  try {
    const { refundId } = req.params;

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message: "Refund ID is required"
      });
    }

    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found"
      });
    }

    // Only allow deletion of approved refunds (optional: you can allow any status)
    if (refund.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Only approved refunds can be deleted"
      });
    }

    await Refund.findByIdAndDelete(refundId);

    res.status(200).json({
      success: true,
      message: "Refund deleted successfully"
    });

  } catch (error) {
    console.error("Delete refund error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  createRefund,
  getAllRefunds,
  getRefundsByCustomer,
  processRefund,
  markCouponAsUsed,
  deleteRefund
};