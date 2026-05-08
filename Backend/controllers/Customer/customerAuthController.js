const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../../models/Customer/Customer");

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone, address, bio } = req.body;

    // Check existing
    const existing = await Customer.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = new Customer({
      fullName,
      email,
      password: hashedPassword,
      phone,
      address,
      bio,
    });

    await customer.save();

    res.status(201).json({ success: true, message: "Customer registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ success: false, message: "No account with this email" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: customer._id, role: customer.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        role: customer.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


module.exports = { registerCustomer, loginCustomer };
