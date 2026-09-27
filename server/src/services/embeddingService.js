const { ai, embeddingModel } = require('../config/gemini');
const Embedding = require('../models/Embedding');
const env = require('../config/env');

/**
 * Generate a real vector embedding using Gemini embedding model
 * @param {string} text - The input text to embed
 * @returns {Promise<number[]>} - 768-dimensional float vector
 */
const generateEmbedding = async (text) => {
  if (!env.GEMINI_API_KEY) {
    const error = new Error('Gemini API is not configured. Please set GEMINI_API_KEY in environment.');
    error.statusCode = 503;
    throw error;
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    const error = new Error('Input text is required for embedding generation');
    error.statusCode = 400;
    throw error;
  }

  try {
    const response = await ai.models.embedContent({
      model: embeddingModel,
      contents: text.trim(),
      config: {
        outputDimensionality: 768
      }
    });

    const embeddings = response.embeddings;
    if (!embeddings || !embeddings[0] || !Array.isArray(embeddings[0].values)) {
      const error = new Error('Invalid embedding response received from Gemini');
      error.statusCode = 502;
      throw error;
    }

    return embeddings[0].values;
  } catch (error) {
    if (error.statusCode) throw error;
    const apiError = new Error(`Gemini Embedding error: ${error.message}`);
    apiError.statusCode = 500;
    throw apiError;
  }
};

/**
 * Generate and store/upsert an embedding for a specific Blog
 * @param {string|ObjectId} blogId - Blog post ID
 * @param {string} textToEmbed - Text representing the blog (e.g. title + content)
 */
const createOrUpdateBlogEmbedding = async (blogId, textToEmbed) => {
  const vector = await generateEmbedding(textToEmbed);

  const embedding = await Embedding.findOneAndUpdate(
    { blogId },
    {
      blogId,
      vector,
      model: embeddingModel,
      textChunk: textToEmbed.substring(0, 1000)
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return embedding;
};

module.exports = {
  generateEmbedding,
  createOrUpdateBlogEmbedding
};
