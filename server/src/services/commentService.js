const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

/**
 * Add a comment to a published blog
 */
const addComment = async (blogId, content, user) => {
  if (!content || !content.trim()) {
    const error = new Error('Comment content is required');
    error.statusCode = 400;
    throw error;
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  if (blog.status !== 'published') {
    const error = new Error('Comments are only permitted on published blogs');
    error.statusCode = 400;
    throw error;
  }

  const comment = await Comment.create({
    blogId: blog._id,
    userId: user._id,
    content: content.trim(),
    status: 'approved'
  });

  return comment.populate('userId', 'name role');
};

/**
 * Get all comments for a blog post
 */
const getCommentsByBlog = async (blogId, user = null) => {
  const blog = await Blog.findById(blogId);
  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  const filter = { blogId };

  // Moderation filtering: editors and admins can see all comments (including pending/spam)
  if (!user || !['editor', 'admin'].includes(user.role)) {
    if (user) {
      filter.$or = [{ status: 'approved' }, { userId: user._id }];
    } else {
      filter.status = 'approved';
    }
  }

  return Comment.find(filter)
    .populate('userId', 'name role')
    .sort({ createdAt: -1 });
};

/**
 * Update a comment (content or moderation status)
 */
const updateComment = async (id, { content, status }, user) => {
  const comment = await Comment.findById(id);
  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = comment.userId.toString() === user._id.toString();
  const isModerator = ['editor', 'admin'].includes(user.role);

  // Status moderation
  if (status !== undefined) {
    if (!isModerator) {
      const error = new Error('Forbidden: Only editors and admins can moderate comment status');
      error.statusCode = 403;
      throw error;
    }
    if (!['pending', 'approved', 'spam'].includes(status)) {
      const error = new Error(`Invalid comment status: '${status}'`);
      error.statusCode = 400;
      throw error;
    }
    comment.status = status;
  }

  // Content modification
  if (content !== undefined) {
    if (!isOwner && user.role !== 'admin') {
      const error = new Error('Forbidden: You can only edit your own comments');
      error.statusCode = 403;
      throw error;
    }
    if (!content.trim()) {
      const error = new Error('Comment content cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    comment.content = content.trim();
  }

  await comment.save();
  return comment.populate('userId', 'name role');
};

/**
 * Delete a comment
 */
const deleteComment = async (id, user) => {
  const comment = await Comment.findById(id);
  if (!comment) {
    const error = new Error('Comment not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = comment.userId.toString() === user._id.toString();
  const isPrivileged = ['editor', 'admin'].includes(user.role);

  if (!isOwner && !isPrivileged) {
    const error = new Error('Forbidden: You do not have permission to delete this comment');
    error.statusCode = 403;
    throw error;
  }

  await Comment.deleteOne({ _id: id });
  return { message: 'Comment deleted successfully' };
};

module.exports = {
  addComment,
  getCommentsByBlog,
  updateComment,
  deleteComment
};
