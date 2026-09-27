const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

// Current user profile
router.get('/profile', authenticateToken, userController.getProfile);

// Admin-only user listing
router.get('/', authenticateToken, requireRole('admin'), userController.getAllUsers);

// Update user details (Self or Admin)
router.put('/:id', validateObjectId('id'), authenticateToken, userController.updateUser);

// Admin-only role modification
router.patch('/:id/role', validateObjectId('id'), authenticateToken, requireRole('admin'), userController.updateRole);

module.exports = router;
