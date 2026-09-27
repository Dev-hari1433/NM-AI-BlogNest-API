const geminiService = require('../services/geminiService');
const blogService = require('../services/blogService');
const embeddingService = require('../services/embeddingService');

/**
 * Generate blog post using Gemini
 * POST /api/ai/generate-blog
 */
const generateBlog = async (req, res, next) => {
  try {
    const { topic, category, saveAsBlog, status } = req.body;

    const generated = await geminiService.generateBlog(topic);

    // Optional flow: automatically save as a Blog and generate its embedding
    if (saveAsBlog && category && req.user) {
      const blog = await blogService.createBlog(
        {
          title: generated.title,
          content: generated.content,
          category,
          tags: generated.tags,
          status: status || 'draft'
        },
        req.user
      );

      // Generate and store embedding for the newly saved blog
      try {
        await embeddingService.createOrUpdateBlogEmbedding(
          blog._id,
          `${generated.title}\n${generated.summary}\n${generated.content}`
        );
      } catch (embErr) {
        console.warn(`[EMBEDDING WARNING] Could not generate embedding for blog ${blog._id}: ${embErr.message}`);
      }

      return res.status(201).json({
        success: true,
        message: 'Blog generated and saved successfully',
        data: {
          blog,
          aiGeneration: generated
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blog generated successfully',
      data: generated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize blog content using Gemini
 * POST /api/ai/summarize
 */
const summarizeBlog = async (req, res, next) => {
  try {
    const { content } = req.body;
    const summary = await geminiService.summarizeContent(content);

    return res.status(200).json({
      success: true,
      message: 'Blog summarized successfully',
      data: {
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBlog,
  summarizeBlog
};
