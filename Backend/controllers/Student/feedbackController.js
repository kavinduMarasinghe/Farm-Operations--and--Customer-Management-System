const Feedback = require('../../models/Student/Feedback');
const LearningMaterial = require('../../models/Student/LearningMaterial');
const mongoose = require('mongoose');

// Simple validation function to replace the removed validation.js utility
const validateObjectId = (id) => {
    if (!id) return false;
    return mongoose.Types.ObjectId.isValid(id);
};

const submitFeedback = async (req, res) => {
    try {
        const { type, rating, comment, target } = req.body;
        const student = req.user.id;

        if (!type || !rating || !comment) {
            return res.status(400).json({ message: 'Type, rating, and comment are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Validate target based on type
        if (type === 'MATERIAL') {
            if (!target) {
                return res.status(400).json({ message: 'Material ID is required for MATERIAL feedback' });
            }
            if (!mongoose.Types.ObjectId.isValid(target)) {
                return res.status(400).json({ message: 'Invalid material ID' });
            }
            // Check if material exists
            const material = await LearningMaterial.findById(target);
            if (!material) {
                return res.status(404).json({ message: 'Material not found' });
            }
        } else if (type !== 'GENERAL' && !target) {
            return res.status(400).json({ message: 'Target is required for this feedback type' });
        }

        const feedback = new Feedback({
            student,
            type,
            rating,
            comment,
            target: target || null
        });

        await feedback.save();

        return res.status(201).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getMyFeedback = async (req, res) => {
    try {
        const student = req.user.id;
        
        const feedback = await Feedback.find({ student });

        return res.status(200).json({
            success: true,
            count: feedback.length,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getFeedbackById = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!validateObjectId(id)) {
            return res.status(400).json({ message: 'Invalid feedback ID' });
        }

        const feedback = await Feedback.findById(id);
        
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Check if the feedback belongs to the logged-in student
        if (feedback.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this feedback' });
        }

        return res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const updateFeedback = async (req, res) => {
    try {
        const id = req.params.id;
        const { rating, comment } = req.body;
        
        if (!validateObjectId(id)) {
            return res.status(400).json({ message: 'Invalid feedback ID' });
        }

        // Find the feedback
        const feedback = await Feedback.findById(id);
        
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Check if the feedback belongs to the logged-in student
        if (feedback.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this feedback' });
        }

        // Check if feedback can be updated (e.g., not archived)
        if (feedback.isArchived) {
            return res.status(400).json({ message: 'Archived feedback cannot be updated' });
        }

        // Update feedback
        feedback.rating = rating || feedback.rating;
        feedback.comment = comment || feedback.comment;
        feedback.updatedAt = Date.now();

        await feedback.save();

        return res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error updating feedback:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const deleteFeedback = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!validateObjectId(id)) {
            return res.status(400).json({ message: 'Invalid feedback ID' });
        }

        // Find the feedback
        const feedback = await Feedback.findById(id);
        
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Check if the feedback belongs to the logged-in student
        if (feedback.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this feedback' });
        }

        await feedback.remove();

        return res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    submitFeedback,
    getMyFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback
};