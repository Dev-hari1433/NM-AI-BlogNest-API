const commentService = require('../services/commentService');

const addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(req.params.blogId, req.body.content, req.user);
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

const getCommentsByBlog = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByBlog(req.params.blogId, req.user);
    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getCommentsByBlog,
  updateComment,
  deleteComment
};
