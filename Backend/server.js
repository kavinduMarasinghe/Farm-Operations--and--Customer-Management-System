 const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require('./mongodb.js');
const authRouter = require('./routes/authRoutes.js');
const productRouter = require("./routes/Admin/productRoutes.js");
const Product = require("./models/Admin/Product.js");
const cottageRoutes = require("./routes/Admin/cottageRoutes");
const cartRoutes = require("./routes/Customer/cartRoutes");
const bookingRoutes = require("./routes/Customer/bookingRoutes");
const orderRoutes = require('./routes/Customer/orderRoutes');
const paymentRoutes = require('./routes/Customer/paymentRoutes');
const customerRoutes = require('./routes/Customer/customerRoutes');
const cropYieldRoutes = require('./routes/cropYieldRoutes');
const feedbackRoutes = require('./routes/Customer/feedbackRoutes');
const refundRoutes = require('./routes/Customer/refundRoutes');

const app = express();
const port = process.env.PORT || process.env.port || 8070;
connectDB();

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(cookieParser());

// Debug middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use(cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:5173", "http://127.0.0.1:5173"], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


//api endpoints
app.get('/', (req, res)=> res.send("API Working fine"));
app.use('/api/auth', authRouter);

//endpoints for Product related crud operations
app.use('/api/products', productRouter);

//endpoints for Cottage related crud operations
app.use("/api/cottages", cottageRoutes);

//endpoints for cart operations
app.use("/api/cart", cartRoutes);

//endpoints for cottage bookings
app.use("/api/bookings", bookingRoutes);

//endpoints for the customer feedbacks
app.use('/api/cusFeedbacks', feedbackRoutes);

//endpoints for the customer orders
app.use('/api/cusOrders', orderRoutes);

//endpoints for the customer payments
app.use('/api/payments', paymentRoutes);

//endpoint for customers management
app.use('/api/customers', customerRoutes);

//endpoints for refund management
app.use('/api/refunds', refundRoutes);

//endpoint for admin authentication
app.use("/api/admin/auth", require("./routes/Admin/adminAuthRoutes"));

//endpoint for customer authentication
app.use("/api/customer/auth", require("./routes/Customer/customerAuthRoutes"));

//endpoint for employee authentication
app.use("/api/auth/employee", (req, res, next) => {
  if (req.path === '/login') {
    const { loginEmployee } = require("./controllers/Employee/employeeController");
    return loginEmployee(req, res);
  }
  next();
});

//endpoint for employee profile management
app.use("/api/employee", (req, res, next) => {
  const { protectEmployee } = require("./middleware/employeeAuthMiddleware");
  const { updateEmployeeProfile } = require("./controllers/Employee/employeeController");
  
  if (req.path === '/profile' && req.method === 'PUT') {
    return protectEmployee(req, res, () => {
      updateEmployeeProfile(req, res);
    });
  }
  next();
});

//endpoint for student authentication
app.use("/api/student/auth", require("./routes/Student/studentAuthRoutes"));

// Direct student endpoints (student-accessible)
app.use("/api/student/materials", require("./routes/Student/studentMaterialRoutes"));
app.use("/api/student/sessions", require("./routes/Student/studentLiveSessionRoutes"));
app.use("/api/student/bookings", require("./routes/Student/studentLabTourRoutes"));
app.use("/api/student/labtours", require("./routes/Student/studentLabTourRoutes"));
app.use("/api/student/feedback", require("./routes/Student/studentFeedbackRoutes"));
app.use("/api/student", require("./routes/Student/studentProfileRoutes"));

// Student management endpoints (admin protected)
app.use("/api/admin/student/bookings", require("./routes/Student/studentBookingRoutes"));
app.use("/api/admin/student/feedback", require("./routes/Student/studentFeedbackRoutes"));
app.use("/api/admin/student/livesession", require("./routes/Student/livesessionRoutes"));
app.use("/api/admin/student/material", require("./routes/Student/materialRoutes"));
app.use("/api/admin/student/labtour", require("./routes/Student/labtourRoutes"));
app.use("/api/admin/student/details", require("./routes/Student/studentDetailsRoutes"));
app.use("/api/admin/student/users", require("./routes/Student/studentDetailsRoutes"));
app.use("/api/admin/student/reports", require("./routes/Student/studentReportsRoutes"));

//endpoint for crop yields
app.use('/api/yields', cropYieldRoutes);

//endpoint for employee management
app.use("/api/employees", require("./routes/Employee/employeeRoutes"));

//endpoint for tasks management
app.use("/api/tasks", require("./routes/Employee/taskRoutes"));

//endpoint for timesheets management
app.use("/api/timesheets", require("./routes/Employee/timesheetRoutes"));

// endpoint for order reports generationn
app.use("/api/reports", require("./routes/Admin/orderReportRoutes"));

//ebdpoint for cottage reports generation
app.use("/api/reports", require("./routes/Admin/cottageReportRoutes"));

// Test endpoint to create a test employee account
app.post('/test/create-employee', async (req, res) => {
    try {
        const Employee = require("./models/Employee/Employee.js");
        const User = require("./models/Employee/User.js");
        
        const testData = {
            name: "Test Employee",
            email: "test@employee.com",
            password: "password123",
            phone: "1234567890",
            role: "Worker",
            status: "Active",
            hourlyRate: 25
        };

        // Check if already exists
        const existingUser = await User.findOne({ email: testData.email });
        if (existingUser) {
            return res.json({ message: "Test employee already exists", email: testData.email });
        }

        // Create Employee
        const employee = await Employee.create(testData);

        // Create corresponding User
        await User.create({
            email: testData.email,
            password: testData.password,
            role: "employee",
        });

        res.json({ 
            message: "Test employee created successfully", 
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating test employee", error: error.message });
    }
});

// Debug endpoint to check employees
app.get('/test/employees', async (req, res) => {
    try {
        const Employee = require("./models/Employee/Employee.js");
        const User = require("./models/Employee/User.js");
        
        const employees = await Employee.find().limit(5);
        const users = await User.find({ role: 'employee' }).limit(5);
        
        res.json({ 
            employees: employees.map(e => ({
                id: e._id,
                name: e.name,
                email: e.email,
                role: e.role,
                status: e.status
            })),
            users: users.map(u => ({
                id: u._id,
                email: u.email,
                role: u.role
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching employees", error: error.message });
    }
});

app.listen(port, 'localhost', ()=> console.log(`Server started on localhost:${port}`));


