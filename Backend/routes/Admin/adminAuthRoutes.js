// routes/adminAuthRoutes.js
const express = require("express");
const { loginAdmin, registerAdmin, updateAdminProfile } = require("../../controllers/Admin/adminAuthController");
const { protect } = require("../../middleware/authMiddleware");
const router = express.Router();

router.post("/login", loginAdmin);
router.post("/register", registerAdmin); // use only in Postman for now

// Protected route to update admin profile
router.put('/profile', protect, updateAdminProfile);

module.exports = router;
