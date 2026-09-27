const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      minlength: [3, 'Blog title must be at least 3 characters'],
      maxlength: [200, 'Blog title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Blog content is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true
    },
    photo: {
      type: String,
      trim: true,
      default: null
    },
    likes: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'scheduled', 'published'],
        message: '{VALUE} is not a supported blog status'
      },
      default: 'draft',
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Helpful compound index for queries
blogSchema.index({ status: 1, createdAt: -1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
