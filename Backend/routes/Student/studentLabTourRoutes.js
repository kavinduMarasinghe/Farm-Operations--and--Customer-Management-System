const express = require('express');
const router = express.Router();
const { protectStudent } = require('../../middleware/studentAuthMiddleware');
const LabTour = require('../../models/Student/LabTour');
const LabTourBooking = require('../../models/Student/LabTourBooking');

// All routes are protected and require student authentication
router.use(protectStudent);

// GET /api/student/labtours - Get available lab tours
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      showArchived = 'false',
      sort = 'date',
      order = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    // Don't show archived tours by default
    if (showArchived === 'false') {
      query.archived = { $ne: true };
      query.date = { $gte: new Date() }; // Only show future tours
    }
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Get tours with pagination
    const tours = await LabTour.find(query)
      .select('title description location date startTime endTime capacity archived')
      .sort(sortObj)
      .limit(limitNumber)
      .skip(skip);

    // Transform tours to match frontend expectations
    const transformedTours = tours.map(tour => ({
      _id: tour._id,
      title: tour.title,
      description: tour.description,
      location: tour.location,
      startDate: tour.date, // Map 'date' to 'startDate' for frontend
      endDate: tour.date, // Use same date as end date
      capacity: tour.capacity,
      archived: tour.archived,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt
    }));

    // Get total count for pagination
    const total = await LabTour.countDocuments(query);

    res.status(200).json({
      success: true,
      tours: transformedTours,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching lab tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab tours',
      error: error.message
    });
  }
});

// POST /api/student/bookings - Create a new booking  
router.post('/', async (req, res) => {
  try {
    const { tourId, notes } = req.body;

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: 'Tour ID is required'
      });
    }

    // Check if tour exists and is not archived
    const tour = await LabTour.findOne({ 
      _id: tourId, 
      archived: { $ne: true } 
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Lab tour not found or is archived'
      });
    }

    // Check if student already has a booking for this tour
    const existingBooking = await LabTourBooking.findOne({
      student: req.student._id,
      tour: tourId
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this tour'
      });
    }

    // Check capacity (if capacity field exists)
    if (tour.capacity) {
      const currentBookings = await LabTourBooking.countDocuments({
        tour: tourId,
        status: { $ne: 'CANCELLED' }
      });

      if (currentBookings >= tour.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Tour is at full capacity'
        });
      }
    }

    // Create booking
    const booking = new LabTourBooking({
      student: req.student._id,
      tour: tourId,
      date: tour.date, // Use the tour's date as the booking date
      notes: notes || '',
      status: 'PENDING'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});


// GET /api/student/bookings/mine - Get student's own bookings
router.get('/mine', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Find bookings for the logged-in student
    const bookings = await LabTourBooking.find({ student: req.student._id })
      .populate('tour')
      .sort(sortObj)
      .limit(limitNumber)
      .skip(skip);

    // Transform data for frontend
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      tour: booking.tour ? {
        _id: booking.tour._id,
        title: booking.tour.title || '',
        description: booking.tour.description || '',
        location: booking.tour.location || '',
        startDate: booking.tour.date || '',
        endDate: booking.tour.date || '',
      } : null,
      student: booking.student,
      date: booking.date,
      status: booking.status,
      notes: booking.notes || '',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Get total count for pagination
    const total = await LabTourBooking.countDocuments({ student: req.student._id });

    res.status(200).json({
      success: true,
      bookings: transformedBookings,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student bookings',
      error: error.message
    });
  }
});

// PATCH /api/student/bookings/:id - Update booking status (cancel booking)
router.patch('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;

    // Validate status
    if (!['CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Only cancellation is allowed for student bookings'
      });
    }

    // Find the booking and ensure it belongs to the current student
    const booking = await LabTourBooking.findOne({
      _id: bookingId,
      student: req.student._id
    }).populate('tour');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to modify it'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if the tour date has passed (optional restriction)
    if (booking.tour && booking.tour.date < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for a tour that has already occurred'
      });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking: {
        _id: booking._id,
        tour: booking.tour ? {
          _id: booking.tour._id,
          title: booking.tour.title,
          location: booking.tour.location,
          startDate: booking.tour.date
        } : null,
        status: booking.status,
        date: booking.date
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// DELETE /api/student/bookings/:id - Cancel a booking
router.delete('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking and ensure it belongs to the current student
    const booking = await LabTourBooking.findOne({
      _id: bookingId,
      student: req.student._id
    }).populate('tour');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to cancel it'
      });
    }

    // Check if booking can be cancelled (not already cancelled)
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if the tour date has passed (optional restriction)
    if (booking.tour && booking.tour.date < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for a tour that has already occurred'
      });
    }

    // Update booking status to cancelled instead of deleting
    booking.status = 'CANCELLED';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        tour: booking.tour ? {
          _id: booking.tour._id,
          title: booking.tour.title,
          location: booking.tour.location,
          startDate: booking.tour.date
        } : null,
        status: booking.status,
        date: booking.date
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

module.exports = router;