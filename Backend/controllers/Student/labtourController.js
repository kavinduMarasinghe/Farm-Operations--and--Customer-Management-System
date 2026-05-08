/**
 * Lab Tour Controller - Student Side
 */
const LabTour = require('../../models/Student/LabTour');
const LabTourBooking = require('../../models/Student/LabTourBooking');
const mongoose = require('mongoose');

const getLabTours = async (req, res) => {
  try {
    // Extract query parameters
    const { search, sort = 'startDate', order = 'asc', page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // Build query - only show non-archived tours with future dates
    const query = { 
      archived: false,
      startDate: { $gte: new Date() } // Only future tours
    };
    
    // Add search if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Determine sort order
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    // Get total count for pagination
    const total = await LabTour.countDocuments(query);
    
    // Get tours with pagination
    const tours = await LabTour.find(query)
      .sort(sortOptions)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    
    // For each tour, check and include available spots
    const toursWithAvailability = await Promise.all(tours.map(async (tour) => {
      // Count existing bookings for this tour
      const bookingsCount = await LabTourBooking.countDocuments({ 
        tour: tour._id,
        status: { $ne: 'CANCELLED' } // Don't count cancelled bookings
      });
      
      // Calculate available spots
      const availableSpots = Math.max(0, tour.capacity - bookingsCount);
      
      // Check if current user has already booked this tour
      const userBooking = await LabTourBooking.findOne({
        student: req.user.id,
        tour: tour._id,
        status: { $ne: 'CANCELLED' }
      });
      
      // Convert to plain object to add properties
      const tourObj = tour.toObject();
      return {
        ...tourObj,
        availableSpots,
        isFull: availableSpots === 0,
        isBooked: !!userBooking,
        bookingId: userBooking ? userBooking._id : null
      };
    }));
    
    return res.json({
      success: true,
      tours: toursWithAvailability,
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

module.exports = {
  getLabTours
};
