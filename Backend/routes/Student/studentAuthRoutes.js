const express = require('express');
const { studentLogin, studentRegister } = require('../../controllers/Student/studentAuthController.js');

const router = express.Router();

// Student authentication routes
router.post('/login', studentLogin);
router.post('/register', studentRegister);

module.exports = router;