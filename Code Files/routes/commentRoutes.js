const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

const router = express.Router();

// Direct comment modification and deletion
router.put('/:id', validateObjectId('id'), authenticateToken, commentController.updateComment);
router.delete('/:id', validateObjectId('id'), authenticateToken, commentController.deleteComment);

module.exports = router;
