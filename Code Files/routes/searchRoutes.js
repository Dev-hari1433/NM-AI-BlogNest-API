const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

// Search endpoints
router.get('/', searchController.searchBlogs);
router.get('/semantic', searchController.semanticSearch);

module.exports = router;
