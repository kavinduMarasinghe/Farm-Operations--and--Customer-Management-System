const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const LiveSession = require('../../models/Student/LiveSession');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/livesession - Get all live sessions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      timeframe, 
      instructor 
    } = req.query;

    // Build query
    const query = {};
    
    // Search in title and instructor
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by instructor
    if (instructor) {
      query.instructor = { $regex: instructor, $options: 'i' };
    }
    
    // Filter by timeframe
    if (timeframe === 'upcoming') {
      query.startTime = { $gt: new Date() };
    } else if (timeframe === 'past') {
      query.startTime = { $lt: new Date() };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get sessions with pagination
    const sessions = await LiveSession.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    // Transform sessions to include participant count and availability
    const transformedSessions = sessions.map(session => {
      const sessionObj = session.toObject();
      return {
        ...sessionObj,
        participantCount: session.participants ? session.participants.length : 0,
        spotsAvailable: session.capacity - (session.participants ? session.participants.length : 0),
        isFull: (session.participants ? session.participants.length : 0) >= session.capacity
      };
    });

    res.json({ 
      success: true, 
      message: 'Live sessions fetched successfully', 
      sessions: transformedSessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/student/livesession - Create new live session
router.post('/', async (req, res) => {
  try {
    const { title, description, instructor, startTime, endTime, capacity } = req.body;

    // Validate required fields
    if (!title || !startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and start time are required' 
      });
    }

    const session = new LiveSession({
      title,
      description,
      instructor,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      capacity: capacity || 50,
      participants: []
    });

    await session.save();

    res.status(201).json({ 
      success: true, 
      message: 'Live session created successfully', 
      session 
    });
  } catch (error) {
    console.error('Error creating live session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/student/livesession/:id - Update live session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, instructor, startTime, endTime, capacity } = req.body;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live session not found' 
      });
    }

    // Update fields
    if (title) session.title = title;
    if (description !== undefined) session.description = description;
    if (instructor !== undefined) session.instructor = instructor;
    if (startTime) session.startTime = new Date(startTime);
    if (endTime) session.endTime = new Date(endTime);
    if (capacity) session.capacity = capacity;

    await session.save();

    res.json({ 
      success: true, 
      message: 'Live session updated successfully', 
      session 
    });
  } catch (error) {
    console.error('Error updating live session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/student/livesession/:id - Delete live session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live session not found' 
      });
    }

    await LiveSession.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'Live session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting live session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/student/livesession/:id/capacity - Update session capacity
router.patch('/:id/capacity', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity } = req.body;

    if (!capacity || capacity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid capacity is required' 
      });
    }

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Live session not found' 
      });
    }

    session.capacity = capacity;
    await session.save();

    res.json({ 
      success: true, 
      message: 'Session capacity updated successfully', 
      session 
    });
  } catch (error) {
    console.error('Error updating session capacity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;