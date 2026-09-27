const searchService = require('../services/searchService');
const vectorSearchService = require('../services/vectorSearchService');

/**
 * Full-text search using Atlas Search ($search)
 * GET /api/search?q=...
 */
const searchBlogs = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const results = await searchService.searchBlogs(q, { limit });

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        query: q,
        count: results.length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Semantic vector search using Atlas Vector Search ($vectorSearch)
 * GET /api/search/semantic?q=...
 */
const semanticSearch = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const results = await vectorSearchService.semanticSearch(q, { limit });

    res.status(200).json({
      success: true,
      message: 'Semantic search completed successfully',
      data: {
        query: q,
        count: results.length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchBlogs,
  semanticSearch
};
