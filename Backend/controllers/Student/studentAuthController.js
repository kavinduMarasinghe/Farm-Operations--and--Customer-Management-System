const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../../models/Student/Student.js');

// Student Login
const studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find student by email
        const student = await Student.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        });

        if (!student) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Update last login
        student.lastLogin = new Date();
        await student.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: student._id, 
                email: student.email, 
                role: student.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            student: {
                id: student._id,
                name: student.fullName,
                fullName: student.fullName,
                email: student.email,
                role: student.role,
                isAccountVerified: student.isAccountVerified,
                isActive: student.isActive
            }
        });

    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Student Registration (if needed)
const studentRegister = async (req, res) => {
    try {
        const { 
            first_name, 
            last_name, 
            email, 
            password, 
            contact
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !password || !contact) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided' 
            });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingStudent) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student already exists with this email' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new student
        const student = new Student({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: hashedPassword,
            contact,
            role: 'student'
        });

        await student.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: student._id, 
                email: student.email, 
                role: student.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            token,
            student: {
                id: student._id,
                name: student.fullName,
                fullName: student.fullName,
                email: student.email,
                role: student.role,
                isAccountVerified: student.isAccountVerified,
                isActive: student.isActive
            }
        });

    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

module.exports = {
    studentLogin,
    studentRegister
};