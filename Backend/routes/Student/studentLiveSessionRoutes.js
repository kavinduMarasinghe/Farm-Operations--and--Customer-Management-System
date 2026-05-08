const express = require('express');
const router = express.Router();
const { protectStudent } = require('../../middleware/studentAuthMiddleware');
const LiveSession = require('../../models/Student/LiveSession');

// All routes are protected and require student authentication
router.use(protectStudent);

// GET /api/student/sessions - Get available live sessions
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      upcoming = 'true',
      sort = 'startTime',
      order = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    // Filter for upcoming sessions by default
    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    }
    
    // Search in title and instructor
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Get sessions with pagination
    const sessions = await LiveSession.find(query)
      .select('title description instructor startTime endTime capacity participants status')
      .sort(sortObj)
      .limit(limitNumber)
      .skip(skip);

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live sessions',
      error: error.message
    });
  }
});

// GET /api/student/sessions/mine - Get student's enrolled sessions
router.get('/mine', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      upcoming,
      sort = 'startTime',
      order = 'asc'
    } = req.query;

    // Build query for sessions where student is enrolled
    const query = { participants: req.student._id };
    
    // Filter for upcoming/past sessions
    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    } else if (upcoming === 'false') {
      query.startTime = { $lt: new Date() };
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Get sessions with pagination
    const sessions = await LiveSession.find(query)
      .select('title description instructor startTime endTime status')
      .sort(sortObj)
      .limit(limitNumber)
      .skip(skip);

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching enrolled sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled sessions',
      error: error.message
    });
  }
});

// POST /api/student/sessions/:id/enroll - Enroll in a session
router.post('/:id/enroll', async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found'
      });
    }

    // Check if session is full
    const participants = session.participants || [];
    if (participants.length >= session.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Session is at full capacity'
      });
    }

    // Check if student is already enrolled
    if (participants.includes(req.student._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this session'
      });
    }

    // Check if session has already started
    if (new Date() >= session.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in a session that has already started'
      });
    }

    // Enroll student
    if (!session.participants) {
      session.participants = [];
    }
    session.participants.push(req.student._id);
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in session'
    });
  } catch (error) {
    console.error('Error enrolling in session:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in session',
      error: error.message
    });
  }
});

// DELETE /api/student/sessions/:id/drop - Drop enrollment from a session
router.delete('/:id/drop', async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found'
      });
    }

    // Check if student is enrolled
    const participants = session.participants || [];
    if (!participants.includes(req.student._id)) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this session'
      });
    }

    // Check if session has already started
    if (new Date() >= session.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot drop from a session that has already started'
      });
    }

    // Remove student from enrolled list
    if (session.participants) {
      session.participants = session.participants.filter(
        studentId => !studentId.equals(req.student._id)
      );
    }
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Successfully dropped from session'
    });
  } catch (error) {
    console.error('Error dropping from session:', error);
    res.status(500).json({
      success: false,
      message: 'Error dropping from session',
      error: error.message
    });
  }
});

module.exports = router;