const express = require('express');
const router = express.Router();
const { protectStudent } = require('../../middleware/studentAuthMiddleware');
const { getProfile, updateProfile } = require('../../controllers/Student/studentProfileController');

router.get('/profile', protectStudent, getProfile);
router.put('/profile', protectStudent, updateProfile);

module.exports = router;