const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const LabTour = require('../../models/Student/LabTour');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/labtour - Get all lab tours
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', showArchived = 'false', startDateMin, startDateMax } = req.query;
    
    // Build query filters
    let filter = {};
    
    // Handle archived filter
    if (showArchived === 'false') {
      filter.archived = { $ne: true };
    } else if (showArchived === 'true') {
      filter.archived = true;
    }
    // 'all' shows both archived and non-archived
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (startDateMin || startDateMax) {
      filter.date = {};
      if (startDateMin) filter.date.$gte = new Date(startDateMin);
      if (startDateMax) filter.date.$lte = new Date(startDateMax);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tours = await LabTour.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTours = await LabTour.countDocuments(filter);

    // Transform tours to include booking statistics (mock data for now)
    const transformedTours = tours.map(tour => ({
      _id: tour._id,
      title: tour.title,
      description: tour.description,
      location: tour.location,
      date: tour.date,
      startTime: tour.startTime,
      endTime: tour.endTime,
      capacity: tour.capacity || 20,
      archived: tour.archived || false,
      bookingsCount: 0, // TODO: Calculate from actual bookings
      pendingCount: 0,  // TODO: Calculate from actual bookings
      confirmedCount: 0, // TODO: Calculate from actual bookings
      availableSpots: tour.capacity || 20, // TODO: Calculate based on bookings
      isFull: false, // TODO: Calculate based on bookings vs capacity
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt
    }));

    res.json({ 
      success: true, 
      message: 'Lab tours fetched successfully', 
      tours: transformedTours,
      pagination: {
        total: totalTours,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTours / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching lab tours:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/student/labtour - Create new lab tour
router.post('/', async (req, res) => {
  try {
    const { title, description, location, date, startTime, endTime, capacity } = req.body;
    
    // Basic validation
    if (!title || !location || !date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: title, location, date, startTime, endTime, capacity' 
      });
    }

    const newTour = new LabTour({
      title,
      description,
      location,
      date: new Date(date),
      startTime,
      endTime,
      capacity: parseInt(capacity),
      archived: false
    });

    const savedTour = await newTour.save();

    res.status(201).json({ 
      success: true, 
      message: 'Lab tour created successfully', 
      tour: savedTour
    });
  } catch (error) {
    console.error('Error creating lab tour:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/student/labtour/:id - Update lab tour
router.put('/:id', async (req, res) => {
  try {
    const { title, description, location, date, startTime, endTime, capacity } = req.body;
    
    const updatedTour = await LabTour.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        location,
        date: new Date(date),
        startTime,
        endTime,
        capacity: parseInt(capacity)
      },
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ success: false, message: 'Lab tour not found' });
    }

    res.json({ 
      success: true, 
      message: 'Lab tour updated successfully', 
      tour: updatedTour
    });
  } catch (error) {
    console.error('Error updating lab tour:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/student/labtour/:id/archive - Toggle archive status
router.patch('/:id/archive', async (req, res) => {
  try {
    const tour = await LabTour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Lab tour not found' });
    }

    tour.archived = !tour.archived;
    await tour.save();

    res.json({ 
      success: true, 
      message: `Lab tour ${tour.archived ? 'archived' : 'unarchived'} successfully`, 
      tour: tour
    });
  } catch (error) {
    console.error('Error updating archive status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/student/labtour/:id - Delete lab tour
router.delete('/:id', async (req, res) => {
  try {
    const deletedTour = await LabTour.findByIdAndDelete(req.params.id);
    
    if (!deletedTour) {
      return res.status(404).json({ success: false, message: 'Lab tour not found' });
    }

    res.json({ 
      success: true, 
      message: 'Lab tour deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting lab tour:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;