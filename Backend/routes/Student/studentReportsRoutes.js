const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const Student = require('../../models/Student/Student');
const LabTourBooking = require('../../models/Student/LabTourBooking');
const Feedback = require('../../models/Student/Feedback');

// All routes are protected and require admin authentication
router.use(protect);

// Student Reports endpoints
router.get('/enrollment', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const verifiedStudents = await Student.countDocuments({ isAccountVerified: true });
    
    res.json({ 
      success: true,
      message: 'Student enrollment report', 
      data: {
        total: totalStudents,
        active: activeStudents,
        verified: verifiedStudents,
        unverified: totalStudents - verifiedStudents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const avgRating = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    res.json({ 
      success: true,
      message: 'Student performance report', 
      data: {
        averageRating: avgRating[0]?.avgRating || 0,
        totalFeedback: await Feedback.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const verifiedStudents = await Student.countDocuments({ isAccountVerified: true });
    const totalBookings = await LabTourBooking.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    
    // Calculate percentage changes (mock data for now)
    res.json({ 
      success: true,
      message: 'Overview data fetched successfully', 
      data: {
        students: {
          total: totalStudents,
          active: activeStudents
        },
        tours: {
          total: 25, // Mock: total lab tours available
          active: 18 // Mock: currently active lab tours
        },
        sessions: {
          total: 45, // Mock: total live sessions
          upcoming: 8 // Mock: upcoming live sessions
        },
        bookings: {
          total: totalBookings,
          pending: Math.floor(totalBookings * 0.3), // Mock: 30% pending
          confirmed: Math.floor(totalBookings * 0.6) // Mock: 60% confirmed
        },
        enrollments: {
          total: verifiedStudents
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const { timeSpan = 'week', startDate, endDate } = req.query;
    
    // Mock activity data for different time spans with correct structure
    let bookings = [];
    let enrollments = [];
    
    if (timeSpan === 'week') {
      bookings = [
        { _id: '2024-01-15', count: 20, confirmed: 15, cancelled: 3 },
        { _id: '2024-01-16', count: 25, confirmed: 20, cancelled: 2 },
        { _id: '2024-01-17', count: 18, confirmed: 14, cancelled: 1 },
        { _id: '2024-01-18', count: 22, confirmed: 18, cancelled: 2 },
        { _id: '2024-01-19', count: 30, confirmed: 25, cancelled: 2 },
        { _id: '2024-01-20', count: 16, confirmed: 12, cancelled: 1 },
        { _id: '2024-01-21', count: 13, confirmed: 10, cancelled: 1 }
      ];
      enrollments = [
        { _id: '2024-01-15', count: 12, enrolled: 10, dropped: 1 },
        { _id: '2024-01-16', count: 15, enrolled: 13, dropped: 1 },
        { _id: '2024-01-17', count: 18, enrolled: 16, dropped: 0 },
        { _id: '2024-01-18', count: 14, enrolled: 12, dropped: 1 },
        { _id: '2024-01-19', count: 20, enrolled: 18, dropped: 1 },
        { _id: '2024-01-20', count: 16, enrolled: 14, dropped: 1 },
        { _id: '2024-01-21', count: 13, enrolled: 11, dropped: 0 }
      ];
    } else if (timeSpan === 'month') {
      bookings = [
        { _id: 'Week 1', count: 120, confirmed: 95, cancelled: 8 },
        { _id: 'Week 2', count: 140, confirmed: 115, cancelled: 10 },
        { _id: 'Week 3', count: 130, confirmed: 105, cancelled: 12 },
        { _id: 'Week 4', count: 150, confirmed: 125, cancelled: 9 }
      ];
      enrollments = [
        { _id: 'Week 1', count: 65, enrolled: 58, dropped: 3 },
        { _id: 'Week 2', count: 75, enrolled: 68, dropped: 4 },
        { _id: 'Week 3', count: 70, enrolled: 62, dropped: 5 },
        { _id: 'Week 4', count: 80, enrolled: 72, dropped: 3 }
      ];
    } else if (timeSpan === 'year') {
      bookings = [
        { _id: 'Jan', count: 540, confirmed: 440, cancelled: 35 },
        { _id: 'Feb', count: 580, confirmed: 480, cancelled: 40 },
        { _id: 'Mar', count: 620, confirmed: 520, cancelled: 30 },
        { _id: 'Apr', count: 600, confirmed: 500, cancelled: 35 }
      ];
      enrollments = [
        { _id: 'Jan', count: 290, enrolled: 260, dropped: 15 },
        { _id: 'Feb', count: 320, enrolled: 290, dropped: 18 },
        { _id: 'Mar', count: 350, enrolled: 315, dropped: 20 },
        { _id: 'Apr', count: 330, enrolled: 300, dropped: 12 }
      ];
    }
    
    res.json({ 
      success: true,
      message: 'Activity data fetched successfully', 
      data: {
        timeSpan: timeSpan,
        bookings: bookings,
        enrollments: enrollments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/attendance', async (req, res) => {
  // Get attendance reports
  res.json({ message: 'Student attendance report', data: [] });
});

router.get('/feedback-summary', (req, res) => {
  // Get feedback summary
  res.json({ message: 'Student feedback summary', data: [] });
});

router.get('/lab-tour-stats', (req, res) => {
  // Get lab tour statistics
  res.json({ message: 'Lab tour statistics', data: [] });
});

router.get('/material-usage', (req, res) => {
  // Get material usage statistics
  res.json({ message: 'Material usage statistics', data: [] });
});

router.get('/live-session-stats', (req, res) => {
  // Get live session statistics
  res.json({ message: 'Live session statistics', data: [] });
});

module.exports = router;