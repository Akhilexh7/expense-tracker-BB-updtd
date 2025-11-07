const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup - User registration
router.post('/signup', authController.signup);

// POST /api/auth/login - User login
router.post('/login', authController.login);

module.exports = router;