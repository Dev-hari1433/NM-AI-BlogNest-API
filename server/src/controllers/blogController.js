const blogService = require('../services/blogService');

const createBlog = async (req, res, next) => {
  try {
    const blog = await blogService.createBlog(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
};

const getBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getBlogs(req.query, req.user);
    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getBlogById = async (req, res, next) => {
  try {
    const blog = await blogService.getBlogById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
};

const updateBlog = async (req, res, next) => {
  try {
    const blog = await blogService.updateBlog(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
};

const deleteBlog = async (req, res, next) => {
  try {
    const result = await blogService.deleteBlog(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
};
