
const LabTour = require('../../models/Student/LabTour');
const LabTourBooking = require('../../models/Student/LabTourBooking');
const mongoose = require('mongoose');


const createBooking = async (req, res) => {
  try {
    const { tourId } = req.body;
    
    if (!tourId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID is required' 
      });
    }
    
    // Validate tour ID format
    if (!mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid tour ID format' 
      });
    }
    
    // Find the requested tour
    const tour = await LabTour.findById(tourId);
    
    // Check if tour exists
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tour not found' 
      });
    }
    
    // Check if tour is archived
    if (tour.archived) {
      return res.status(400).json({ 
        success: false, 
        message: 'This tour is no longer available for booking' 
      });
    }
    
    // Check if tour date is in the past
    if (tour.startDate < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot book a tour that has already started' 
      });
    }
    
    // Check if student already has an active booking for this tour
    const existingBooking = await LabTourBooking.findOne({
      tour: tourId,
      student: req.user.id,
      status: { $ne: 'CANCELLED' }
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a booking for this tour',
        bookingId: existingBooking._id
      });
    }
    
    // Check if tour has available capacity (only count confirmed bookings)
    const bookingsCount = await LabTourBooking.countDocuments({
      tour: tourId,
      status: 'CONFIRMED'
    });
    
    if (bookingsCount >= tour.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'This tour is fully booked' 
      });
    }
    
    // Create the booking
    const booking = new LabTourBooking({
      tour: tourId,
      student: req.user.id,
      date: tour.startDate,
      status: 'PENDING', // Require admin approval
      notes: req.body.notes || ''
    });
    
    await booking.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tour booking request submitted successfully. Awaiting admin approval.',
      booking: {
        id: booking._id,
        tourId: booking.tour,
        tourTitle: tour.title,
        date: booking.date,
        status: booking.status
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


const getMyBookings = async (req, res) => {
  try {
    // Extract query parameters
    const { status, sort = 'date', order = 'asc', page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // Build query
    const query = { student: req.user.id };
    
    // Filter by status if provided
    if (status) {
      query.status = status.toUpperCase();
    }
    
    // Determine sort order
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    // Get total count for pagination
    const total = await LabTourBooking.countDocuments(query);
    
    // Get bookings with pagination
    const bookings = await LabTourBooking.find(query)
      .populate('tour', 'title description location startDate endDate')
      .sort(sortOptions)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    
    console.log(`Found ${bookings.length} bookings for user ${req.user.id}`);
    
    return res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking ID format' 
      });
    }
    
    // Find the booking
    const booking = await LabTourBooking.findById(bookingId);
    
    // Check if booking exists
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Check if this booking belongs to the requesting student
    if (booking.student.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only cancel your own bookings' 
      });
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ 
        success: false, 
        message: 'This booking is already cancelled' 
      });
    }
    
    // Get tour details to check dates
    const tour = await LabTour.findById(booking.tour);
    
    // Optional: Check if tour has already happened or is too close to cancel
    if (tour && tour.startDate < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel a booking for a tour that has already started' 
      });
    }
    
    // Update booking status to cancelled
    booking.status = 'CANCELLED';
    await booking.save();
    
    return res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking
};
