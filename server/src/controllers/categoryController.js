
const mongoose = require("mongoose");
const Category = require("../models/Category");

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// CREATE CATEGORY
const createCategory = async (req, res, next) => {
  try {
    const { categoryName, description } = req.body;

    const existingCategory = await Category.findOne({
      categoryName: categoryName.trim()
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists."
      });
    }

    const category = await Category.create({
      categoryName,
      description
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists."
      });
    }

    next(error);
  }
};

// GET ALL CATEGORIES
const getAllCategories = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.categoryName = {
        $regex: search,
        $options: "i"
      };
    }

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// GET CATEGORY BY ID
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID."
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryName, description, status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID."
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found."
      });
    }

    if (categoryName !== undefined) {
      const duplicate = await Category.findOne({
        categoryName: categoryName.trim(),
        _id: { $ne: id }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Category name already exists."
        });
      }

      category.categoryName = categoryName;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (status !== undefined) {
      category.status = status;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists."
      });
    }

    next(error);
  }
};

// SOFT DELETE CATEGORY
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID."
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found."
      });
    }

    if (category.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Category is already inactive."
      });
    }

    category.status = "inactive";
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
