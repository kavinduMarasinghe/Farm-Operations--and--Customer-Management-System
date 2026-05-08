const Payment = require('../../models/Customer/Payment');

// Create a new payment
const createPayment = async (req, res) => {
  const { orderId, cardholderName, cardNumber, expiryDate, cvv, totalAmount } = req.body;

  if (!orderId || !cardholderName || !cardNumber || !expiryDate || !cvv || !totalAmount) {
    return res.status(400).json({ message: 'Missing required payment information' });
  }

  try {
    // Simulate payment processing
    const newPayment = new Payment({
      orderId,
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
      totalAmount,
      status: 'completed', // Assuming successful payment
    });

    await newPayment.save();
    res.status(201).json({ message: 'Payment processed successfully', payment: newPayment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing payment' });
  }
};

// Get payment details by order ID
const getPaymentByOrderId = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Use 'orderId' field to find the payment (not the default _id)
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment details' });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'completed', 'failed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const payment = await Payment.findOne({ orderId });  // Ensure querying by orderId, not _id

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();

    res.status(200).json({ message: 'Payment status updated successfully', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
};

// Delete a payment
const deletePayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const payment = await Payment.findOneAndDelete({ orderId });  // Ensure querying by orderId, not _id

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment' });
  }
};

module.exports = {
  createPayment,
  getPaymentByOrderId,
  updatePaymentStatus,
  deletePayment,
};
