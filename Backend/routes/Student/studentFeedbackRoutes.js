const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const Feedback = require('../../models/Student/Feedback');
const Student = require('../../models/Student/Student');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/feedback - Get all feedback
router.get('/', async (req, res) => {
  try {
    // support pagination & filters
    const { page = 1, limit = 10, search = '', type, hidden, minRating, maxRating } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (hidden !== undefined && hidden !== 'ALL') filter.hidden = hidden === 'true';
    if (minRating) filter.rating = { ...(filter.rating || {}), $gte: parseInt(minRating) };
    if (maxRating) filter.rating = { ...(filter.rating || {}), $lte: parseInt(maxRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find(filter)
      .populate('student', 'first_name last_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    const transformedFeedback = feedback.map(item => ({
      _id: item._id,
      student: item.student ? {
        _id: item.student._id,
        first_name: item.student.first_name,
        last_name: item.student.last_name,
        email: item.student.email
      } : null,
      rating: item.rating,
      comment: item.comment,
      type: item.type || item.category || 'GENERAL',
      hidden: !!item.hidden,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.json({ 
      success: true, 
      message: 'Feedback fetched successfully', 
      data: transformedFeedback,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/student/feedback/stats - Aggregate statistics for feedback
router.get('/stats', async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const hidden = await Feedback.countDocuments({ hidden: true });
    const visible = total - hidden;

    // type stats
    const typesAgg = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);

    const typeStats = typesAgg.map(t => ({ type: t._id || 'GENERAL', count: t.count, avgRating: t.avgRating || 0 }));

    // rating distribution
    const ratingAgg = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const ratingDistribution = ratingAgg.map(r => ({ rating: r._id || 0, count: r.count }));

    // trends (simple recent vs previous 30 days)
    const now = new Date();
    const recentFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevFrom = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const prevTo = recentFrom;

    const recentCount = await Feedback.countDocuments({ createdAt: { $gte: recentFrom } });
    const previousCount = await Feedback.countDocuments({ createdAt: { $gte: prevFrom, $lt: prevTo } });

    const recentAvgAgg = await Feedback.aggregate([
      { $match: { createdAt: { $gte: recentFrom } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const recentAvg = recentAvgAgg[0]?.avgRating || 0;

    const percentChange = previousCount ? ((recentCount - previousCount) / previousCount) * 100 : null;

    const stats = {
      total,
      hidden,
      visible,
      typeStats,
      ratingDistribution,
      trends: {
        recent: { count: recentCount, avgRating: recentAvg },
        previousPeriod: { count: previousCount },
        percentChange
      }
    };

    res.json({ success: true, message: 'Feedback stats fetched', data: stats });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;