const User = require('../models/User');

const ALLOWED_ROLES = ['admin', 'editor', 'author', 'reader'];

/**
 * Update a user's role (Admin only)
 */
const updateUserRole = async (userId, newRole) => {
  if (!newRole || !ALLOWED_ROLES.includes(newRole)) {
    const error = new Error(`Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.role = newRole;
  await user.save();
  return user;
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async () => {
  return User.find().select('-password').sort({ createdAt: -1 });
};

/**
 * Get user profile by ID
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user profile by ID
 */
const updateUser = async (userId, updates, requestingUser) => {
  if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== userId.toString()) {
    const error = new Error('Forbidden: You can only update your own profile');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (updates.name && typeof updates.name === 'string' && updates.name.trim()) {
    user.name = updates.name.trim();
  }

  if (updates.bio !== undefined && typeof updates.bio === 'string') {
    user.bio = updates.bio.trim();
  }

  if (updates.role && requestingUser.role === 'admin' && ALLOWED_ROLES.includes(updates.role)) {
    user.role = updates.role;
  }

  await user.save();
  return User.findById(user._id).select('-password');
};

module.exports = {
  updateUserRole,
  getAllUsers,
  getUserProfile,
  updateUser
};
