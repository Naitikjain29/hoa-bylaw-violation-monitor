
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateMiddleware");

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const {
  createCategoryValidator,
  categoryIdValidator,
  updateCategoryValidator,
  getCategoriesValidator
} = require("../validators/categoryValidator");

// All category routes require login
router.use(protect);

// Create category - Admin only
router.post(
  "/",
  authorizeRoles("admin"),
  createCategoryValidator,
  validateRequest,
  createCategory
);

// Get all categories - All authenticated users
router.get(
  "/",
  getCategoriesValidator,
  validateRequest,
  getAllCategories
);

// Get category by ID
router.get(
  "/:id",
  categoryIdValidator,
  validateRequest,
  getCategoryById
);

// Update category - Admin only
router.put(
  "/:id",
  authorizeRoles("admin"),
  updateCategoryValidator,
  validateRequest,
  updateCategory
);

// Deactivate category - Admin only
router.delete(
  "/:id",
  authorizeRoles("admin"),
  categoryIdValidator,
  validateRequest,
  deleteCategory
);

module.exports = router;
