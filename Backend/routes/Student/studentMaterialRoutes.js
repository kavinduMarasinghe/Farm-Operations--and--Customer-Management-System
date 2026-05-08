const express = require('express');
const router = express.Router();
const { protectStudent } = require('../../middleware/studentAuthMiddleware');
const LearningMaterial = require('../../models/Student/LearningMaterial');

// All routes are protected and require student authentication
router.use(protectStudent);

// GET /api/student/materials - Get learning materials accessible to students
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type
    } = req.query;

    // Build query - only show public materials (accessible to all students)
    const query = { visibility: 'PUBLIC' };
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Get materials with pagination
    const materials = await LearningMaterial.find(query)
      .select('title description type fileUrl createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .skip(skip);

    // Get total count for pagination
    const total = await LearningMaterial.countDocuments(query);

    res.status(200).json({
      success: true,
      materials,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching learning materials',
      error: error.message
    });
  }
});

// GET /api/student/materials/:id - Get specific material details
router.get('/:id', async (req, res) => {
  try {
    const material = await LearningMaterial.findOne({
      _id: req.params.id,
      visibility: 'PUBLIC'
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Learning material not found'
      });
    }

    res.status(200).json({
      success: true,
      material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching learning material',
      error: error.message
    });
  }
});

module.exports = router;