const { ai, generationModel } = require('../config/gemini');
const env = require('../config/env');

/**
 * Reusable prompt templates for Gemini AI
 */
const prompts = {
  blogGeneration: (topic) => `You are a professional technology and domain-expert blog writer.
Write an engaging, high-quality, and well-structured blog article on the topic: "${topic}".

Your response must be a strict JSON object with no preamble, no markdown formatting (do NOT wrap in \`\`\`json or \`\`\`), and adhering strictly to this schema:
{
  "title": "Engaging and clear blog post title",
  "content": "Full in-depth article body with multiple clear sections, markdown subheadings (##, ###), and detailed analysis.",
  "summary": "Concise 2-3 sentence executive summary of the post.",
  "tags": ["relevant-tag1", "relevant-tag2", "relevant-tag3", "relevant-tag4"]
}`,

  summarization: (content) => `You are an expert editorial assistant.
Provide a concise, clear, and comprehensive summary capturing the core insights and takeaways of the following article:

"""
${content}
"""

Return ONLY the summary text with no preamble or conversational filler.`
};

/**
 * Clean and parse JSON responses from LLM outputs
 */
const cleanAndParseJSON = (rawText) => {
  let cleaned = rawText.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const error = new Error('Failed to parse structured JSON from AI response: ' + err.message);
    error.statusCode = 502;
    throw error;
  }
};

/**
 * Generate a structured blog post using Gemini
 */
const generateBlog = async (topic) => {
  if (!env.GEMINI_API_KEY) {
    const error = new Error('Gemini API is not configured. Please set GEMINI_API_KEY in environment.');
    error.statusCode = 503;
    throw error;
  }

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    const error = new Error('A valid topic string is required');
    error.statusCode = 400;
    throw error;
  }

  if (topic.trim().length > 300) {
    const error = new Error('Topic cannot exceed 300 characters');
    error.statusCode = 400;
    throw error;
  }

  try {
    const prompt = prompts.blogGeneration(topic.trim());
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawOutput = response.text || '';
    if (!rawOutput) {
      const error = new Error('Gemini returned an empty response');
      error.statusCode = 502;
      throw error;
    }

    const parsed = cleanAndParseJSON(rawOutput);

    // Validate required output shape
    if (!parsed.title || !parsed.content) {
      const error = new Error('AI output is missing mandatory title or content fields');
      error.statusCode = 502;
      throw error;
    }

    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).toLowerCase().trim()) : []
    };
  } catch (error) {
    if (error.statusCode) throw error;
    const apiError = new Error(`Gemini API error: ${error.message}`);
    apiError.statusCode = 500;
    throw apiError;
  }
};

/**
 * Summarize blog content using Gemini
 */
const summarizeContent = async (content) => {
  if (!env.GEMINI_API_KEY) {
    const error = new Error('Gemini API is not configured. Please set GEMINI_API_KEY in environment.');
    error.statusCode = 503;
    throw error;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    const error = new Error('Content is required for summarization');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = content.trim();

  // Guard against oversized content
  if (trimmed.length > 50000) {
    const error = new Error('Content exceeds maximum length of 50,000 characters for summarization');
    error.statusCode = 400;
    throw error;
  }

  if (trimmed.length < 20) {
    const error = new Error('Content is too short to summarize (minimum 20 characters required)');
    error.statusCode = 400;
    throw error;
  }

  try {
    const prompt = prompts.summarization(trimmed);
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: prompt
    });

    const summary = (response.text || '').trim();
    if (!summary) {
      const error = new Error('Gemini returned an empty summary');
      error.statusCode = 502;
      throw error;
    }

    return summary;
  } catch (error) {
    if (error.statusCode) throw error;
    const apiError = new Error(`Gemini API error: ${error.message}`);
    apiError.statusCode = 500;
    throw apiError;
  }
};

module.exports = {
  generateBlog,
  summarizeContent
};
