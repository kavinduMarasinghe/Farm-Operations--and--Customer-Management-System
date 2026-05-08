const Student = require('../../models/Student/Student');
const bcrypt = require('bcryptjs');

// GET /api/student/profile
const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ student });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/student/profile
const updateProfile = async (req, res) => {
  try {
    console.log('PUT /api/student/profile called');
    console.log('Student ID from token:', req.student._id);
    console.log('Request body:', req.body);
    
    const student = await Student.findById(req.student._id);
    if (!student) {
      console.log('Student not found in database');
      return res.status(404).json({ message: 'Student not found' });
    }

    const { first_name, last_name, email, contact, profileImage, currentPassword, newPassword } = req.body;
    
    // Handle password change if provided
    if (currentPassword && newPassword) {
      console.log('Password change requested');
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isCurrentPasswordValid) {
        console.log('Current password is invalid');
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      student.password = hashedNewPassword;
      console.log('Password updated successfully');
    }
    
    // Update other profile fields
    if (first_name !== undefined) student.first_name = first_name;
    if (last_name !== undefined) student.last_name = last_name;
    if (email !== undefined) student.email = email;
    if (contact !== undefined) student.contact = contact;
    if (profileImage !== undefined) student.profileImage = profileImage;

    const updatedStudent = await student.save();
    console.log('Profile updated successfully for student:', updatedStudent._id);
    res.json({ 
      message: 'Profile updated successfully',
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile };