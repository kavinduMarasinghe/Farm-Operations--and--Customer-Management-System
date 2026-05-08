/**
 * Live Session Controller - Student side
 * Handles operations for live sessions and student enrollments
 */
const mongoose = require('mongoose');
const LiveSession = require('../../models/Student/LiveSession');
const Student = require('../../models/Student/Student');

const getSessions = async (req, res) => {
    try {
        // Extract query parameters for filtering
        const { 
            instructor,
            search,
            upcoming = 'true', 
            sort = 'startTime', 
            order = 'asc',
            page = 1,
            limit = 10
        } = req.query;
        
        // Build query
        const query = {};
        
        // Filter by instructor if provided
        if (instructor) {
            query.instructor = { $regex: instructor, $options: 'i' };
        }
        
        // Filter for upcoming sessions only (if upcoming=true)
        if (upcoming === 'true') {
            query.startTime = { $gt: new Date() };
        }
        
        // Add search filter if provided (search in title and description)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { instructor: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Determine sort order
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sort] = sortOrder;
        
        // Fetch sessions with pagination
        const sessions = await LiveSession.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('title description instructor startTime endTime capacity participants');
        
        // Count total sessions for pagination
        const total = await LiveSession.countDocuments(query);
        
        // Check enrollment status for the current user
        const userId = req.user?.id; // Changed from _id to id to match userAuth middleware
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        const sessionsWithEnrollment = await Promise.all(sessions.map(async (session) => {
            const sessionObj = session.toObject();
            
            // Check if the user is enrolled - add null checks
            const isEnrolled = session.participants && 
                session.participants.some(id => id && id.toString() === userId.toString());
            
            // Get enrollment count - filter out null/undefined participants
            const validParticipants = session.participants ? session.participants.filter(id => id != null) : [];
            const enrollmentCount = validParticipants.length;
            
            // Check if session is full
            const isFull = enrollmentCount >= session.capacity;
            
            return {
                ...sessionObj,
                isEnrolled,
                isFull,
                enrollmentCount,
                spotsAvailable: Math.max(0, session.capacity - enrollmentCount)
            };
        }));
        
        // Return response
        res.status(200).json({
            success: true,
            sessions: sessionsWithEnrollment,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch live sessions',
            error: error.message
        });
    }
};

const enrollSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Changed from _id to id to match userAuth middleware
        
        // Check if user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Validate session ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID format'
            });
        }
        
        // Find the session
        const session = await LiveSession.findById(id);
        
        // Check if session exists
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Live session not found'
            });
        }
        
        // Check if session has already started
        if (session.startTime < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot enroll in a session that has already started'
            });
        }
        
        // Check if session is full
        const validParticipants = session.participants ? session.participants.filter(id => id != null) : [];
        const enrollmentCount = validParticipants.length;
        if (enrollmentCount >= session.capacity) {
            return res.status(400).json({
                success: false,
                message: 'This session is already full'
            });
        }
        
        // Check if user is already enrolled
        if (session.participants && 
            session.participants.some(id => id && id.toString() === userId.toString())) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this session'
            });
        }
        
        // Add user to participants list
        session.participants = session.participants || [];
        session.participants.push(userId);
        
        // Save the updated session
        await session.save();
        
        // Find the student and update their sessions list (if Student model has liveSessions field)
        const student = await Student.findById(userId);
        if (student) {
            // Check if Student model has a liveSessions field
            if (typeof student.liveSessions !== 'undefined') {
                student.liveSessions = student.liveSessions || [];
                student.liveSessions.push(id);
                await student.save();
            }
        }
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Successfully enrolled in the live session',
            session: {
                _id: session._id,
                title: session.title,
                startTime: session.startTime,
                endTime: session.endTime,
                enrollmentCount: session.participants.filter(id => id != null).length,
                spotsAvailable: session.capacity - session.participants.filter(id => id != null).length
            }
        });
    } catch (error) {
        console.error('Error enrolling in live session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enroll in live session',
            error: error.message
        });
    }
};

const dropSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Changed from _id to id to match userAuth middleware
        
        // Check if user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Validate session ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID format'
            });
        }
        
        // Find the session
        const session = await LiveSession.findById(id);
        
        // Check if session exists
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Live session not found'
            });
        }
        
        // Check if session has already ended
        if (session.endTime && session.endTime < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot drop enrollment for a session that has already ended'
            });
        }
        
        // Check if user is enrolled
        if (!session.participants || 
            !session.participants.some(id => id && id.toString() === userId.toString())) {
            return res.status(400).json({
                success: false,
                message: 'You are not enrolled in this session'
            });
        }
        
        // Remove user from participants
        session.participants = session.participants.filter(
            id => id && id.toString() !== userId.toString()
        );
        
        // Save the updated session
        await session.save();
        
        // Find the student and update their sessions list (if Student model has liveSessions field)
        const student = await Student.findById(userId);
        if (student) {
            // Check if Student model has a liveSessions field
            if (typeof student.liveSessions !== 'undefined') {
                student.liveSessions = student.liveSessions.filter(
                    sessionId => sessionId.toString() !== id.toString()
                );
                await student.save();
            }
        }
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Successfully dropped enrollment from the live session',
            session: {
                _id: session._id,
                title: session.title,
                startTime: session.startTime,
                endTime: session.endTime,
                enrollmentCount: session.participants.filter(id => id != null).length,
                spotsAvailable: session.capacity - session.participants.filter(id => id != null).length
            }
        });
    } catch (error) {
        console.error('Error dropping enrollment from live session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to drop enrollment from live session',
            error: error.message
        });
    }
};

const getMySessions = async (req, res) => {
    try {
        const userId = req.user?.id; // Changed from _id to id to match userAuth middleware
        
        // Check if user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Extract query parameters for filtering
        const { 
            upcoming = 'true',
            sort = 'startTime', 
            order = 'asc',
            page = 1,
            limit = 10
        } = req.query;
        
        // Build query to find sessions where user is a participant
        const query = {
            participants: userId
        };
        
        // Filter for upcoming sessions only (if upcoming=true)
        if (upcoming === 'true') {
            query.startTime = { $gt: new Date() };
        } else if (upcoming === 'false') {
            query.startTime = { $lte: new Date() };
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Determine sort order
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sort] = sortOrder;
        
        // Fetch the user's sessions with pagination
        const sessions = await LiveSession.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Count total sessions for pagination
        const total = await LiveSession.countDocuments(query);
        
        // Format sessions and add enrollment info
        const formattedSessions = sessions.map(session => {
            const sessionObj = session.toObject();
            const validParticipants = session.participants ? session.participants.filter(id => id != null) : [];
            const enrollmentCount = validParticipants.length;
            
            return {
                ...sessionObj,
                isEnrolled: true,
                enrollmentCount,
                spotsAvailable: Math.max(0, session.capacity - enrollmentCount)
            };
        });
        
        // Return response
        res.status(200).json({
            success: true,
            sessions: formattedSessions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching enrolled sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your enrolled sessions',
            error: error.message
        });
    }
};

module.exports = {
    getSessions,
    enrollSession,
    dropSession,
    getMySessions
};