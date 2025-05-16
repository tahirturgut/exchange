const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /auth/login
 * @desc    Login a user and get JWT token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   DELETE /auth/unregister
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/unregister', authenticate, authController.unregister);

module.exports = router; 