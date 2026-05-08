const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const LearningMaterial = require('../../models/Student/LearningMaterial');

// All routes are protected and require admin authentication
router.use(protect);

// GET /api/admin/student/material - Get all learning materials with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type, 
      visibility,
      department,
      year
    } = req.query;

    // Build query
    const query = {};
    
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
    
    // Filter by visibility
    if (visibility) {
      query.visibility = visibility;
    }
    
    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    // Filter by year
    if (year) {
      query.year = parseInt(year);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get materials with pagination
    const materials = await LearningMaterial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LearningMaterial.countDocuments(query);

    res.json({ 
      success: true, 
      message: 'Learning materials fetched successfully', 
      materials: materials,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/student/material - Create new learning material
router.post('/', async (req, res) => {
  try {
    const { title, description, type, link, fileUrl, tags, visibility, department, year } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and type are required' 
      });
    }

    const material = new LearningMaterial({
      title,
      description,
      type,
      link,
      fileUrl,
      tags: tags || [],
      visibility: visibility || 'PUBLIC',
      department,
      year
    });

    await material.save();

    res.status(201).json({ 
      success: true, 
      message: 'Learning material created successfully', 
      material 
    });
  } catch (error) {
    console.error('Error creating learning material:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/student/material/:id - Update learning material
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, link, fileUrl, tags, visibility, department, year } = req.body;

    const material = await LearningMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning material not found' 
      });
    }

    // Update fields
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (type) material.type = type;
    if (link !== undefined) material.link = link;
    if (fileUrl !== undefined) material.fileUrl = fileUrl;
    if (tags) material.tags = tags;
    if (visibility) material.visibility = visibility;
    if (department !== undefined) material.department = department;
    if (year !== undefined) material.year = year;

    await material.save();

    res.json({ 
      success: true, 
      message: 'Learning material updated successfully', 
      material 
    });
  } catch (error) {
    console.error('Error updating learning material:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/student/material/:id - Delete learning material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await LearningMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning material not found' 
      });
    }

    await LearningMaterial.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'Learning material deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting learning material:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;