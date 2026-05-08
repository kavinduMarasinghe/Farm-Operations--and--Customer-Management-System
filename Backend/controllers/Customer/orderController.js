const mongoose = require("mongoose");
const Order = require("../../models/Customer/Order");
const Customer = require("../../models/Customer/Customer");
const PDFDocument = require("pdfkit");

// Hardcoded userId for testing (replace once auth is set up)
const TEST_USER_ID = "68d75d33566c5aa39dbd99b4"; // make sure this exists in your DB

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { customerId, items, total, subtotal, discount, couponUsed, status, paymentStatus, customerInfo, deliveryInstructions } = req.body;

    // Validate customer ID is provided
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID format" });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    console.log("Creating order for customer:", customer ? customer.fullName : "Customer not found");

    const newOrder = new Order({
      customerId,
      customerInfo,
      items,
      total,
      subtotal: subtotal || total, // fallback to total if subtotal not provided
      discount: discount || 0,
      couponUsed: couponUsed || null,
      status: status || "pending",
      paymentStatus: paymentStatus || "unpaid",  // ✅ use frontend value, fallback unpaid
      deliveryInstructions,
      date: new Date().toISOString().split("T")[0],
    });

    await newOrder.save();
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Get all orders
const getAllOrders = async (req, res) => {
  try {
    console.log("Admin requesting all orders...");
    const orders = await Order.find().populate("customerId", "fullName email");
    console.log("Orders found:", orders.length);
    if (orders.length > 0) {
      console.log("First order sample:");
      console.log("- customerId populated:", orders[0].customerId);
      console.log("- customerInfo form data:", orders[0].customerInfo);
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// Get a single order by ID
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id).populate("customerId", "fullName email");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
};

// Get orders for a particular customer
const getCustomerOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const orders = await Order.find({ customerId: userId });

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found for this user" });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update an order (status, items, etc.)
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, items, total, customerInfo, deliveryInstructions, paymentStatus } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✅ Only update the fields provided
    if (status) order.status = status;
    if (items) order.items = items;
    if (total) order.total = total;
    if (customerInfo) order.customerInfo = customerInfo;
    if (deliveryInstructions) order.deliveryInstructions = deliveryInstructions;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Error updating order" });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, message: "Error deleting order" });
  }
};

// Generate bill PDF for a specific order
const getOrderBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customerId", "name email");
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order._id}.pdf`
    );

    doc.pipe(res);

    // ================= HEADER =================
    doc
      .fontSize(22)
      .text("FarmerHub Invoice", { align: "center", underline: true });
    doc.moveDown();

    // ================= ORDER INFO =================
    doc.fontSize(12);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${order.date}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    // ================= CUSTOMER INFO =================
    doc.fontSize(14).text("Customer Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Name: ${order.customerInfo.name}`);
    doc.text(`Email: ${order.customerInfo.email}`);
    doc.text(`Phone: ${order.customerInfo.phone}`);
    doc.text(`Address: ${order.customerInfo.address}`);
    if (order.customerInfo.deliveryInstructions) {
      doc.text(`Delivery Instructions: ${order.customerInfo.deliveryInstructions}`);
    }
    doc.moveDown();

    // ================= ITEMS TABLE HEADER =================
    doc.fontSize(14).text("Order Items", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50;
    const quantityX = 250;
    const priceX = 320;
    const totalX = 420;

    doc.fontSize(12).text("Item", itemX, tableTop, { bold: true });
    doc.text("Qty", quantityX, tableTop);
    doc.text("Price", priceX, tableTop);
    doc.text("Total", totalX, tableTop);

    // draw a line under header
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // ================= ITEMS LIST =================
    let y = tableTop + 25;
    order.items.forEach((item) => {
      doc.text(item.name, itemX, y);
      doc.text(item.quantity.toString(), quantityX, y);
      doc.text(`Rs. ${item.price.toFixed(2)}`, priceX, y);
      doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, totalX, y);
      y += 20;
    });

    // ================= TOTAL =================
    doc.moveDown(2);
    doc.fontSize(14).text(`Grand Total: Rs. ${order.total.toFixed(2)}`, {
      align: "right",
    });

    // ================= FOOTER =================
    doc.moveDown(2);
    doc.fontSize(10).text(
      "Thank you for shopping with FarmerHub!",
      { align: "center", oblique: true }
    );

    doc.end();
  } catch (error) {
    console.error("Error generating bill:", error);
    res.status(500).json({ success: false, message: "Error generating bill" });
  }
};


module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getCustomerOrders,
  getOrderBill,

};
