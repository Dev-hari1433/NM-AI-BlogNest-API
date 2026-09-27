const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public auth routes with rate limiting and validation
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);

// Protected auth route (for JWT verification)
router.get('/me', authenticateToken, getMe);

module.exports = router;
