// controllers/Admin/cottageReportController.js
const Booking = require("../../models/Customer/CottageBooking");

// GET /api/reports/cottages
const getCottageReport = async (req, res) => {
  try {
    // Total bookings
    const totalBookings = await Booking.countDocuments();

    // Total revenue
    const totalRevenueAgg = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Status summary
    const statusSummary = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Payment summary
    const paymentSummary = await Booking.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Cottage summary (bookings per cottage)
    const cottageSummary = await Booking.aggregate([
      {
        $group: {
          _id: "$cottageName",
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          avgGuests: { $avg: "$guests" },
        },
      },
      { $sort: { bookings: -1 } },
    ]);

    // Recent bookings (latest 5)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "cottageName checkIn checkOut totalAmount status paymentStatus guests"
      );

    // ✅ All bookings (for export, categorized later in frontend)
    const allBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .select(
        "cottageName checkIn checkOut totalAmount status paymentStatus guests"
      );

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        statusSummary,
        paymentSummary,
        cottageSummary,
        recentBookings,
        allBookings, // ✅ added
      },
    });
  } catch (error) {
    console.error("Error generating cottage report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating cottage report" });
  }
};

module.exports = { getCottageReport };
