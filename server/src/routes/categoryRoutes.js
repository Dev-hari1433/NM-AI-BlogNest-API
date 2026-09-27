const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

const router = express.Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validateObjectId('id'), categoryController.getCategoryById);

// Protected routes (Admin & Editor)
router.post('/', authenticateToken, requireRole('editor', 'admin'), categoryController.createCategory);
router.put('/:id', validateObjectId('id'), authenticateToken, requireRole('editor', 'admin'), categoryController.updateCategory);

// Protected route (Admin only)
router.delete('/:id', validateObjectId('id'), authenticateToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
