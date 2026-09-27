const Blog = require('../models/Blog');

/**
 * Execute MongoDB Atlas Search ($search) across title, content, and tags
 * @param {string} query - Keyword search term
 * @param {object} options - Pagination options (limit)
 */
const searchBlogs = async (query, options = {}) => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    const error = new Error("Query parameter 'q' is required for search");
    error.statusCode = 400;
    throw error;
  }

  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);

  const pipeline = [
    {
      $search: {
        index: 'default',
        text: {
          query: query.trim(),
          path: ['title', 'content', 'tags'],
          fuzzy: {
            maxEdits: 1
          }
        }
      }
    },
    {
      $match: {
        status: 'published'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDetails'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        photo: 1,
        tags: 1,
        likes: 1,
        status: 1,
        createdAt: 1,
        score: { $meta: 'searchScore' },
        author: { $arrayElemAt: ['$authorDetails', 0] },
        category: { $arrayElemAt: ['$categoryDetails', 0] }
      }
    },
    {
      $project: {
        'author.password': 0,
        authorDetails: 0,
        categoryDetails: 0
      }
    },
    {
      $limit: limit
    }
  ];

  try {
    const results = await Blog.aggregate(pipeline);
    return results;
  } catch (error) {
    // Handle unindexed cluster or missing search index gracefully
    if (error.message && (error.message.includes('$search') || error.message.includes('Index not found') || error.code === 40324)) {
      const searchError = new Error(
        "MongoDB Atlas Search index 'default' is not configured yet on your Atlas cluster. Please create it using the definition in docs/atlas-search-index.json."
      );
      searchError.statusCode = 503;
      throw searchError;
    }
    throw error;
  }
};

module.exports = {
  searchBlogs
};
