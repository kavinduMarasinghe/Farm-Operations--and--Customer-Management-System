const express = require('express');
const {
  createPayment,
  getPaymentByOrderId,
  updatePaymentStatus,
  deletePayment,
} = require('../../controllers/Customer/paymentController');

const router = express.Router();

// POST route to create a payment
router.post('/', createPayment);

// GET route to get payment details by order ID
router.get('/:orderId', getPaymentByOrderId);

// PUT route to update payment status
router.put('/:orderId', updatePaymentStatus);

// DELETE route to delete a payment
router.delete('/:orderId', deletePayment);

module.exports = router;
