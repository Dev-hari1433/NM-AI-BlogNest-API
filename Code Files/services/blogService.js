const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Comment = require('../models/Comment');

/**
 * Create a new blog post
 */
const createBlog = async (data, user) => {
  const { title, content, category, photo, tags, status } = data;

  if (!title || !title.trim()) {
    const error = new Error('Blog title is required');
    error.statusCode = 400;
    throw error;
  }

  if (!content || !content.trim()) {
    const error = new Error('Blog content is required');
    error.statusCode = 400;
    throw error;
  }

  if (!category) {
    const error = new Error('Category reference is required');
    error.statusCode = 400;
    throw error;
  }

  // Validate category existence (supports ObjectId, category name, or fallback)
  let existingCategory = null;
  if (mongoose.Types.ObjectId.isValid(category)) {
    existingCategory = await Category.findById(category);
  }
  if (!existingCategory) {
    existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${String(category).trim()}$`, 'i') }
    });
  }
  if (!existingCategory) {
    existingCategory = await Category.findOne();
  }
  if (!existingCategory) {
    const error = new Error('No category available. Please create a category first.');
    error.statusCode = 400;
    throw error;
  }

  // Determine initial status based on user role
  let initialStatus = 'draft';
  if (status) {
    if (['editor', 'admin'].includes(user.role)) {
      initialStatus = status;
    } else {
      // Authors can set draft or pending review
      if (['draft', 'pending'].includes(status)) {
        initialStatus = status;
      } else {
        const error = new Error("Authors may only create blogs with status 'draft' or 'pending'");
        error.statusCode = 403;
        throw error;
      }
    }
  }

  const blog = await Blog.create({
    title: title.trim(),
    content: content.trim(),
    author: user._id,
    category: existingCategory._id,
    photo: photo ? photo.trim() : null,
    tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
    status: initialStatus
  });

  return blog.populate([
    { path: 'author', select: 'name email role' },
    { path: 'category', select: 'name description' }
  ]);
};

/**
 * Get paginated list of blogs with filtering and role scoping
 */
const getBlogs = async (query = {}, user = null) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  // Status & Role Visibility Scoping
  if (!user || user.role === 'reader') {
    // Unauthenticated and Readers only see published posts
    filter.status = 'published';
  } else if (user.role === 'author') {
    if (query.status) {
      if (query.status === 'published') {
        filter.status = 'published';
      } else {
        filter.status = query.status;
        filter.author = user._id;
      }
    } else {
      filter.$or = [{ status: 'published' }, { author: user._id }];
    }
  } else if (['editor', 'admin'].includes(user.role)) {
    // Editors & Admins can filter by any status or see all
    if (query.status) {
      filter.status = query.status;
    }
  }

  // Category Filtering (by ID or by name)
  if (query.category) {
    if (mongoose.Types.ObjectId.isValid(query.category)) {
      filter.category = query.category;
    } else {
      const cat = await Category.findOne({ name: query.category.toLowerCase().trim() });
      if (cat) {
        filter.category = cat._id;
      } else {
        // Non-existent category yields empty result
        return {
          blogs: [],
          pagination: { total: 0, page, limit, totalPages: 0 }
        };
      }
    }
  }

  // Tag Filtering
  if (query.tag) {
    filter.tags = query.tag.toLowerCase().trim();
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate('author', 'name email role')
      .populate('category', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Blog.countDocuments(filter)
  ]);

  return {
    blogs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get a single blog by ID with visibility checks
 */
const getBlogById = async (id, user = null) => {
  const blog = await Blog.findById(id)
    .populate('author', 'name email role')
    .populate('category', 'name description');

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  // Non-published posts are visible only to the author, editors, or admins
  if (blog.status !== 'published') {
    const isOwner = user && blog.author && blog.author._id.toString() === user._id.toString();
    const isPrivileged = user && ['editor', 'admin'].includes(user.role);

    if (!isOwner && !isPrivileged) {
      const error = new Error('Forbidden: You do not have permission to view this unpublished blog');
      error.statusCode = 403;
      throw error;
    }
  }

  return blog;
};

/**
 * Update an existing blog
 */
const updateBlog = async (id, updateData, user) => {
  const blog = await Blog.findById(id);

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership & Role Verification
  const isOwner = blog.author.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';

  if (!isOwner && !isAdmin && !isEditor) {
    const error = new Error('Forbidden: You can only modify your own blog posts');
    error.statusCode = 403;
    throw error;
  }

  // Validate category if changing
  if (updateData.category) {
    let catExists = null;
    if (mongoose.Types.ObjectId.isValid(updateData.category)) {
      catExists = await Category.findById(updateData.category);
    }
    if (!catExists) {
      catExists = await Category.findOne({
        name: { $regex: new RegExp(`^${String(updateData.category).trim()}$`, 'i') }
      });
    }
    if (!catExists) {
      const error = new Error(`Category '${updateData.category}' not found`);
      error.statusCode = 400;
      throw error;
    }
    blog.category = catExists._id;
  }

  // Apply updates
  if (updateData.title) blog.title = updateData.title.trim();
  if (updateData.content) blog.content = updateData.content.trim();
  if (updateData.photo !== undefined) blog.photo = updateData.photo ? updateData.photo.trim() : null;
  if (Array.isArray(updateData.tags)) {
    blog.tags = updateData.tags.map((t) => t.trim().toLowerCase());
  }

  // Status updates
  if (updateData.status) {
    if (isAdmin || isEditor) {
      blog.status = updateData.status;
    } else if (isOwner) {
      // Authors can only change status between 'draft' and 'pending'
      if (['draft', 'pending'].includes(updateData.status)) {
        blog.status = updateData.status;
      } else {
        const error = new Error("Authors may only set status to 'draft' or 'pending'");
        error.statusCode = 403;
        throw error;
      }
    }
  }

  await blog.save();

  return blog.populate([
    { path: 'author', select: 'name email role' },
    { path: 'category', select: 'name description' }
  ]);
};

/**
 * Delete a blog
 */
const deleteBlog = async (id, user) => {
  const blog = await Blog.findById(id);

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = blog.author.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Forbidden: You can only delete your own blog posts');
    error.statusCode = 403;
    throw error;
  }

  // Cascade delete associated comments
  await Comment.deleteMany({ blogId: id });
  await Blog.deleteOne({ _id: id });

  return { message: 'Blog and associated comments deleted successfully' };
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
};
