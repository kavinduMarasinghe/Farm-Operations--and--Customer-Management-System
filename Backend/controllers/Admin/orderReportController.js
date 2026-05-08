// controllers/Admin/orderReportController.js
const Order = require("../../models/Customer/Order");

// GET /api/reports/orders
const getOrderReport = async (req, res) => {
  try {
    // Group orders by status
    const statusSummary = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    // Overall totals
    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.revenue || 0;

    // Payment summary
    const paymentSummary = await Order.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    // Recent orders (latest 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("date total status paymentStatus customerInfo.name");

    // ✅ All orders (for export, categorized later in frontend)
    const allOrders = await Order.find()
      .sort({ createdAt: -1 })
      .select("date total status paymentStatus customerInfo.name");

    res.status(200).json({
      success: true,
      data: {
        statusSummary,
        totalOrders,
        totalRevenue,
        paymentSummary,
        recentOrders,
        allOrders, // ✅ added
      },
    });
  } catch (error) {
    console.error("Error generating order report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating report" });
  }
};

module.exports = { getOrderReport };
