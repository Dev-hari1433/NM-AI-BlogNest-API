const userService = require('../services/userService');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    res.status(200).json({
      success: true,
      message: `User role updated to '${user.role}' successfully`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateUser,
  updateRole,
  getAllUsers
};
