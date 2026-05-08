const express = require('express');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getCustomerOrders,
  getOrderBill,
} = require('../../controllers/Customer/orderController');

const router = express.Router();

// POST route to create a new order
router.post('/', createOrder);

// GET route to get all orders
router.get('/', getAllOrders);

// GET route to get all orders for a particular customer
router.get('/user/:userId', getCustomerOrders); // fixed route

// GET route to get an order by its ID
router.get('/:id', getOrderById);

// PUT route to update an order
router.put('/:id', updateOrder);

// DELETE route to delete an order
router.delete('/:id', deleteOrder);

// Route to download bill for an order
router.get('/:id/bill', getOrderBill);

module.exports = router;
