const { GoogleGenAI } = require('@google/genai');
const env = require('./env');

if (!env.GEMINI_API_KEY) {
  console.warn('[WARNING] GEMINI_API_KEY is not defined in environment variables. Gemini AI endpoints will not function.');
}

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY || ''
});

module.exports = {
  ai,
  generationModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
  embeddingModel: env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
};
