const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin/Admin");

// Middleware to protect routes and attach admin to req.admin
const protect = async (req, res, next) => {
	let token;

	try {
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];

			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const admin = await Admin.findById(decoded.id).select("-password");
			
			// Check if admin exists and has proper role
			if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
				return res.status(401).json({ message: "Not authorized" });
			}

			req.admin = admin;
			next();
		} else {
			return res.status(401).json({ message: "No token provided" });
		}
	} catch (error) {
		console.error("Auth middleware error:", error);
		return res.status(401).json({ message: "Not authorized" });
	}
};

module.exports = { protect };
