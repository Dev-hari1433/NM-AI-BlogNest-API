const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog reference is required'],
      unique: true,
      index: true
    },
    vector: {
      type: [Number],
      required: [true, 'Vector embedding is required']
    },
    model: {
      type: String,
      required: [true, 'Embedding model name is required'],
      default: 'gemini-embedding-001'
    },
    textChunk: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Embedding = mongoose.model('Embedding', embeddingSchema);

module.exports = Embedding;
