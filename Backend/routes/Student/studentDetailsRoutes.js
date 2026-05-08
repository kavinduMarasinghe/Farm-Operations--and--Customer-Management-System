const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const Student = require('../../models/Student/Student');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/details - Get all students
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query filters
    let filter = {};
    
    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined && status !== '') {
      if (status === 'active') filter.isActive = true;
      else if (status === 'inactive') filter.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(filter)
      .select('-password -verifyOTP -resetOTP -verifyOTPExpireAt -resetOTPExpireAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments(filter);

    const transformedStudents = students.map(student => ({
      _id: student._id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      contact: student.contact,
      university: student.university,
      field_of_study: student.field_of_study,
      year_of_study: student.year_of_study,
      isAccountVerified: student.isAccountVerified,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    }));

    res.json({ 
      success: true, 
      message: 'Students fetched successfully', 
      data: {
        students: transformedStudents,
        pagination: { 
          total: totalStudents, 
          page: parseInt(page), 
          limit: parseInt(limit), 
          pages: Math.ceil(totalStudents / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/student/details/:id - Get specific student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password -verifyOTP -resetOTP -verifyOTPExpireAt -resetOTPExpireAt');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ 
      success: true, 
      message: 'Student fetched successfully', 
      student: {
        _id: student._id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        contact: student.contact,
        university: student.university,
        field_of_study: student.field_of_study,
        year_of_study: student.year_of_study,
        isAccountVerified: student.isAccountVerified,
        isActive: student.isActive,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/student/details/:id/activate - Toggle student active status
router.put('/:id/activate', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.isActive = !student.isActive;
    await student.save();

    res.json({ 
      success: true, 
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      student: {
        _id: student._id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        isActive: student.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;