// Import the Student model
const StudentModel = require('../../models/Student/Users.js');

// Controller function to get student data by userID
const getStudentData = async (req, res) => {
    try {
        // Extract userID from request body
        const { userID } = req.body || {};

        // Check if userID was provided
        if (!userID) {
            return res.json({ success: false, message: "User ID is required" });
        }

        // Find student by ID in the database
        const student = await StudentModel.findById(userID);

        // If student not found, return error response
        if (!student) {
            return res.json({ success: false, message: "User not Found" });
        }

        // If found, return success response with student details
        res.json({
            success: true,
            userData: {
                // Combine first_name and last_name
                name: student.first_name + " " + student.last_name || "No Name",
                // Return account verification status
                isAccountVerified: student.isAccountVerified
            }
        });

    } catch (error) {
        // Catch and return any errors that occur
        res.json({ success: false, message: error.message });
    }
};

// Export the function so it can be used in routes
module.exports = getStudentData;
