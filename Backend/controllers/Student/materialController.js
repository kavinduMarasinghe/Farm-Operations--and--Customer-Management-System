
const mongoose = require('mongoose');
const LearningMaterial = require('../../models/Student/LearningMaterial');

const getMaterials = async (req, res) => {
    try {
        // Extract query parameters for filtering
        const { 
            type,
            visibility,
            department,
            year,
            search, 
            sort = 'createdAt', 
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;
        
        // Build query
        const query = {}; // Base query
        
        // Add type filter if provided
        if (type) {
            query.type = type.toUpperCase();
        }
        
        // Add visibility filters
        if (visibility) {
            query.visibility = visibility.toUpperCase();
        } else {
            // Default to showing PUBLIC materials and those matching user's department/year
            query.visibility = { $in: ['PUBLIC'] };
            
            // If user has department/year info, include those too
            if (req.user && req.user.department) {
                query.$or = [
                    { visibility: 'PUBLIC' },
                    { visibility: 'DEPARTMENT', department: req.user.department }
                ];
                
                if (req.user.year) {
                    query.$or.push({ visibility: 'YEAR', year: req.user.year });
                }
            }
        }
        
        // Department specific filter
        if (department) {
            query.department = department;
        }
        
        // Year specific filter
        if (year) {
            query.year = parseInt(year);
        }
        
        // Add search filter if provided (search in title, description and tags)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Determine sort order
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sort] = sortOrder;
        
        // Fetch materials with pagination
        const materials = await LearningMaterial.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('title description type fileUrl link visibility department year tags createdAt updatedAt');
        
        // Count total materials for pagination
        const total = await LearningMaterial.countDocuments(query);
        
        // Return response
        res.status(200).json({
            success: true,
            materials,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch learning materials',
            error: error.message
        });
    }
};


const getMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid material ID format'
            });
        }
        
        // Find the material by ID
        const material = await LearningMaterial.findById(id);
        
        // Check if material exists
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Learning material not found'
            });
        }
        
        // Check visibility permissions
        const user = req.user;
        if (material.visibility !== 'PUBLIC') {
            let hasAccess = false;
            
            if (material.visibility === 'DEPARTMENT' && user.department === material.department) {
                hasAccess = true;
            } else if (material.visibility === 'YEAR' && user.year === material.year) {
                hasAccess = true;
            }
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this material'
                });
            }
        }
        
        // Return the material
        res.status(200).json({
            success: true,
            material
        });
    } catch (error) {
        console.error('Error fetching material by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch learning material',
            error: error.message
        });
    }
};

module.exports = {
    getMaterials,
    getMaterialById
};