const Booking = require('../../models/Customer/CottageBooking');
const Cottage = require('../../models/Admin/Cottage');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { cottageId, checkIn, checkOut, guests, totalAmount, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Convert checkIn and checkOut to Date objects
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if the dates are valid
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid dates provided." });
    }

    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ success: false, message: "Check-out date must be after check-in date" });
    }

    // Check if the cottage exists
    const cottage = await Cottage.findById(cottageId);
    if (!cottage) {
      return res.status(404).json({ success: false, message: "Cottage not found" });
    }

    // Check if the cottage is already booked for the same dates
    const existingBooking = await Booking.findOne({
      cottageId,
      $or: [
        // Booking is for a date range that overlaps with the new booking
        { 
          checkIn: { $lt: checkOutDate }, // Existing check-in is before new check-out
          checkOut: { $gt: checkInDate }, // Existing check-out is after new check-in
        },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: "Cottage is already booked for the selected dates" });
    }

    // Check if the number of guests exceeds the cottage capacity
    if (guests > cottage.capacity) {
      return res.status(400).json({ success: false, message: `This cottage can accommodate only ${cottage.capacity} guests.` });
    }

    // Create the booking
    const newBooking = new Booking({
      cottageId,
      cottageName: cottage.name,
      userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalAmount,
      status: 'pending', // Default status
    });

    await newBooking.save();
    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Get all bookings for a user
const getBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const bookings = await Booking.find({ userId }).populate('cottageId');
    // Return empty array if no bookings found - this is not an error
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all bookings for a specific cottage
const getBookingsByCottage = async (req, res) => {
  try {
    const { cottageId } = req.params;

    const bookings = await Booking.find({ cottageId });

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({ success: true, bookings: [] });
    }

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings for cottage:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("cottageId")
      .populate("userId", "fullName email"); // Populate customer data
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update booking details (like changing dates or guests)
const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    // Ensure checkIn and checkOut are valid Date objects
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if the dates are valid
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid dates provided." });
    }

    const booking = await Booking.findById(bookingId).populate('cottageId');
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ success: false, message: "Check-out date must be after check-in date" });
    }

    if (guests > booking.cottageId.capacity) {
      return res.status(400).json({ success: false, message: `This cottage can accommodate only ${booking.cottageId.capacity} guests.` });
    }

    // Calculate the number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Update the booking details
    booking.checkIn = checkInDate;
    booking.checkOut = checkOutDate;
    booking.guests = guests;
    booking.totalAmount = nights * booking.cottageId.pricePerNight;  // Update totalAmount based on new dates

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update only the booking status (pending/confirmed/cancelled)
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update only the payment status (unpaid/paid)
const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body;

    if (!['unpaid', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Delete a booking
const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { createBooking, getBookings, getAllBookings, updateBooking, deleteBooking, updatePaymentStatus, updateBookingStatus, getBookingsByCottage};
