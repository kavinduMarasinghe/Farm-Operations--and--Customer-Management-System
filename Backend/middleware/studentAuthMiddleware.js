const jwt = require("jsonwebtoken");
const Student = require("../models/Student/Student");

// Middleware to protect student routes and attach student to req.student
const protectStudent = async (req, res, next) => {
	let token;

	try {
		console.log('Student auth middleware called');
		console.log('Authorization header:', req.headers.authorization);
		
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
			console.log('Token extracted:', token ? 'Token present' : 'No token');

			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			console.log('Token decoded successfully:', decoded);
			const student = await Student.findById(decoded.id).select("-password");
			if (!student) {
				console.log('Student not found for ID:', decoded.id);
				return res.status(401).json({ message: "Not authorized - invalid student" });
			}

			console.log('Student found:', student._id);
			req.student = student;
			next();
		} else {
			return res.status(401).json({ message: "No token provided" });
		}
	} catch (error) {
		console.error("Student auth middleware error:", error);
		return res.status(401).json({ message: "Not authorized - token invalid" });
	}
};

module.exports = { protectStudent };