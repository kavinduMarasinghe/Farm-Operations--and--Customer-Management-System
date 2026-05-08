const Enrollment = require('../../models/Student/Enrollment');

// Create new enrollment for a training program
const createEnrollment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { programType, programName } = req.body;
    
    if (!programType || !programName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Program type and name are required' 
      });
    }

    // Check if student is already enrolled in this program
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      programType: programType,
      programName: programName
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this program'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: userId,
      programType: programType,
      programName: programName,
      status: 'ENROLLED'
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in program',
      data: enrollment
    });

  } catch (error) {
    console.error('Create enrollment error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this program'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in program',
      error: error.message
    });
  }
};

// Get student's enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const enrollments = await Enrollment.find({ student: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: enrollments
    });

  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrollments',
      error: error.message
    });
  }
};

// Student-facing enrollment activity: returns counts grouped by time span for the logged-in student
const activity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const timeSpan = req.query.timeSpan || 'month';
    const limit = parseInt(req.query.limit) || 6;

    const now = new Date();
    let startDate = new Date();
    let groupByFormat;

    switch (timeSpan) {
      case 'week':
        startDate.setDate(now.getDate() - 7 * limit);
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - limit);
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
    }

    const agg = await Enrollment.aggregate([
      { $match: { student: require('mongoose').Types.ObjectId(userId), createdAt: { $gte: startDate } } },
      { $group: { _id: groupByFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: limit }
    ]);

    return res.json({ success: true, data: agg });
  } catch (error) {
    console.error('Error in student enrollment activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch enrollment activity', error: error.message });
  }
};

module.exports = {
  createEnrollment,
  getMyEnrollments,
  activity
};
