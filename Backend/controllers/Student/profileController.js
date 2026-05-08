const Student = require('../../models/Student/Users.js');


const getMyProfile = async (req, res) => {
  try {

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    return res.json({
      success: true,
      data: {
        id: student._id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        contact: student.contact,
        course: student.course,
        isAccountVerified: student.isAccountVerified,
     
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};


const updateMyProfile = async (req, res) => {
  try {
    
    const { first_name, last_name, contact, course } = req.body;
    
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (contact) updateData.contact = contact;
    if (course) updateData.course = course;
    
  
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true } 
    );


    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: student._id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        contact: student.contact,
        course: student.course,
        isAccountVerified: student.isAccountVerified,
      }
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile
};