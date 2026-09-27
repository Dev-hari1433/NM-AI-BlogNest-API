const Embedding = require('../models/Embedding');
const { generateEmbedding } = require('./embeddingService');

/**
 * Perform semantic search using MongoDB Atlas Vector Search ($vectorSearch)
 * @param {string} query - Natural language search query
 * @param {object} options - Search options (limit)
 */
const semanticSearch = async (query, options = {}) => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    const error = new Error("Query parameter 'q' is required for semantic search");
    error.statusCode = 400;
    throw error;
  }

  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);

  // 1. Generate embedding vector for the natural-language query
  const queryVector = await generateEmbedding(query.trim());

  // 2. Build MongoDB Atlas $vectorSearch pipeline
  const pipeline = [
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'vector',
        queryVector: queryVector,
        numCandidates: 50,
        limit: limit
      }
    },
    {
      $lookup: {
        from: 'blogs',
        localField: 'blogId',
        foreignField: '_id',
        as: 'blog'
      }
    },
    {
      $unwind: '$blog'
    },
    {
      $match: {
        'blog.status': 'published'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'blog.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'blog.author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $project: {
        _id: '$blog._id',
        title: '$blog.title',
        content: '$blog.content',
        photo: '$blog.photo',
        tags: '$blog.tags',
        likes: '$blog.likes',
        status: '$blog.status',
        category: { $arrayElemAt: ['$category', 0] },
        author: {
          _id: { $arrayElemAt: ['$author._id', 0] },
          name: { $arrayElemAt: ['$author.name', 0] },
          role: { $arrayElemAt: ['$author.role', 0] }
        },
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  try {
    const results = await Embedding.aggregate(pipeline);
    return results;
  } catch (error) {
    // Handle unindexed cluster or missing vector search index gracefully
    if (error.message && (error.message.includes('$vectorSearch') || error.message.includes('Index not found') || error.code === 40324)) {
      const searchError = new Error(
        "MongoDB Atlas Vector Search index 'vector_index' is not configured yet on your Atlas cluster. Please create it using the definition in docs/atlas-vector-search-index.json."
      );
      searchError.statusCode = 503;
      throw searchError;
    }
    throw error;
  }
};

module.exports = {
  semanticSearch
};
