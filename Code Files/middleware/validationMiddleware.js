const mongoose = require('mongoose');

/**
 * Validate that a given route parameter is a valid MongoDB ObjectId
 * @param {string} paramName - Name of the route parameter (e.g., 'id', 'blogId')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'`
      });
    }
    next();
  };
};

/**
 * Validate registration body payload
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be a valid string'
    });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  next();
};

/**
 * Validate login body payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  next();
};

/**
 * Validate blog creation body payload
 */
const validateBlog = (req, res, next) => {
  const { title, content, category } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Blog title is required'
    });
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Blog content is required'
    });
  }

  if (!category || !mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({
      success: false,
      message: 'A valid category ObjectId is required'
    });
  }

  next();
};

/**
 * Validate comment creation body payload
 */
const validateComment = (req, res, next) => {
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Comment content is required'
    });
  }

  next();
};

module.exports = {
  validateObjectId,
  validateRegister,
  validateLogin,
  validateBlog,
  validateComment
};
