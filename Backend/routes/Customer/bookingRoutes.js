const express = require("express");
const router = express.Router();
const { createBooking, getBookings, getAllBookings, updateBooking, deleteBooking, updateBookingStatus, updatePaymentStatus, getBookingsByCottage} = require("../../controllers/Customer/bookingController");

// POST -> Create a new booking
router.post("/", createBooking);

// GET -> Get all bookings for the logged-in user
router.get("/user/:userId", getBookings);

// For admin – get all bookings
router.get("/all", getAllBookings);

// PUT -> Update a booking
router.put("/:bookingId", updateBooking);

// DELETE -> Delete a booking
router.delete("/:bookingId", deleteBooking);

//Update Booking status of a booking
router.patch("/:bookingId/status", updateBookingStatus);

//Update payment status of a booking
router.patch("/:bookingId/payment", updatePaymentStatus);

//GET bookings by CottageId
router.get("/cottage/:cottageId", getBookingsByCottage);

module.exports = router;
