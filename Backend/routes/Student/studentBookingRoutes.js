const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const LabTourBooking = require('../../models/Student/LabTourBooking');
const LabTour = require('../../models/Student/LabTour');
const Student = require('../../models/Student/Student');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/bookings - Get all bookings
router.get('/', async (req, res) => {
  try {
    // Fetch all bookings with populated tour and student data
    const bookings = await LabTourBooking.find({})
      .populate('tour')
      .populate('student')
      .sort({ createdAt: -1 });

    // Transform data to match frontend expectations
    const transformedBookings = bookings
      .filter(booking => booking.tour && booking.student)
      .map(booking => ({
        _id: booking._id,
        tour: {
          _id: booking.tour._id,
          title: booking.tour.title || 'Unknown Tour',
          description: booking.tour.description || '',
          location: booking.tour.location || '',
          startDate: booking.tour.date || booking.date,
          endDate: booking.tour.date || booking.date,
          capacity: booking.tour.capacity || 0,
          bookingCount: 0
        },
        student: {
          _id: booking.student._id,
          first_name: booking.student.first_name || 'Unknown',
          last_name: booking.student.last_name || 'Student',
          email: booking.student.email || 'unknown@email.com'
        },
        date: booking.date,
        status: booking.status,
        notes: booking.notes || '',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }));

    res.json({ 
      success: true, 
      message: 'Bookings fetched successfully', 
      bookings: transformedBookings,
      pagination: { 
        total: transformedBookings.length, 
        page: 1, 
        limit: 100, 
        pages: 1 
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/student/bookings/:id - Get specific booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await LabTourBooking.findById(req.params.id)
      .populate('tour', 'title description location date startTime endTime capacity')
      .populate('student', 'first_name last_name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const transformedBooking = {
      _id: booking._id,
      tour: {
        _id: booking.tour._id,
        title: booking.tour.title,
        description: booking.tour.description,
        location: booking.tour.location,
        startDate: booking.tour.date,
        endDate: booking.tour.date,
        capacity: booking.tour.capacity,
        bookingCount: 0
      },
      student: {
        _id: booking.student._id,
        first_name: booking.student.first_name,
        last_name: booking.student.last_name,
        email: booking.student.email
      },
      date: booking.date,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    res.json({ 
      success: true, 
      message: 'Booking fetched successfully', 
      booking: transformedBooking 
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/student/bookings/:id/status - Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be PENDING, CONFIRMED, or CANCELLED' 
      });
    }

    const booking = await LabTourBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ 
      success: true, 
      message: `Booking status updated to ${status}`, 
      booking 
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/student/bookings/:id - Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await LabTourBooking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ 
      success: true, 
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;