const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// AI generation and summarization endpoints
router.post('/generate-blog', optionalAuth, aiController.generateBlog);
router.post('/summarize', optionalAuth, aiController.summarizeBlog);

module.exports = router;
