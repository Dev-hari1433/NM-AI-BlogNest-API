const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'spam'],
        message: '{VALUE} is not a valid comment status'
      },
      default: 'approved',
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

commentSchema.index({ blogId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
