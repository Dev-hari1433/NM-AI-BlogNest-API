const Category = require('../models/Category');
const Blog = require('../models/Blog');

/**
 * Create a new category
 */
const createCategory = async ({ name, description }) => {
  if (!name || !name.trim()) {
    const error = new Error('Category name is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedName = name.trim().toLowerCase();
  const existing = await Category.findOne({ name: normalizedName });
  if (existing) {
    const error = new Error(`Category '${normalizedName}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  return Category.create({
    name: normalizedName,
    description: description ? description.trim() : ''
  });
};

/**
 * Get all categories
 */
const getAllCategories = async () => {
  return Category.find().sort({ name: 1 });
};

/**
 * Get category by ID
 */
const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

/**
 * Update category by ID
 */
const updateCategory = async (id, { name, description }) => {
  const category = await getCategoryById(id);

  if (name && name.trim()) {
    const normalizedName = name.trim().toLowerCase();
    const existing = await Category.findOne({ name: normalizedName, _id: { $ne: id } });
    if (existing) {
      const error = new Error(`Category name '${normalizedName}' is already in use`);
      error.statusCode = 409;
      throw error;
    }
    category.name = normalizedName;
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  return category.save();
};

/**
 * Delete category by ID
 */
const deleteCategory = async (id) => {
  const category = await getCategoryById(id);

  // Prevent deletion if blogs still reference this category
  const blogCount = await Blog.countDocuments({ category: id });
  if (blogCount > 0) {
    const error = new Error(`Cannot delete category: ${blogCount} blog post(s) are associated with it`);
    error.statusCode = 400;
    throw error;
  }

  await Category.deleteOne({ _id: id });
  return { message: 'Category deleted successfully' };
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
