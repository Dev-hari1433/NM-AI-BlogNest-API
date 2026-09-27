const express = require('express');
const blogController = require('../controllers/blogController');
const commentController = require('../controllers/commentController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

const router = express.Router();

// Blog CRUD routes
router.post('/', authenticateToken, requireRole('author', 'editor', 'admin'), blogController.createBlog);
router.get('/', optionalAuth, blogController.getBlogs);
router.get('/:id', validateObjectId('id'), optionalAuth, blogController.getBlogById);
router.put('/:id', validateObjectId('id'), authenticateToken, requireRole('author', 'editor', 'admin'), blogController.updateBlog);
router.delete('/:id', validateObjectId('id'), authenticateToken, requireRole('author', 'admin'), blogController.deleteBlog);

// Nested Comment routes for a blog
router.post('/:blogId/comments', validateObjectId('blogId'), authenticateToken, commentController.addComment);
router.get('/:blogId/comments', validateObjectId('blogId'), optionalAuth, commentController.getCommentsByBlog);

module.exports = router;
