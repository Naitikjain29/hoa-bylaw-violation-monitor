
const { body, param, query } = require("express-validator");

const createCategoryValidator = [
  body("categoryName")
    .isString()
    .withMessage("Category name must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Category name is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Category name must be between 3 and 100 characters."),

  body("description")
    .isString()
    .withMessage("Description must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Description is required.")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters.")
];

const categoryIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("A valid category ID is required.")
];

const updateCategoryValidator = [
  ...categoryIdValidator,

  body()
    .custom((value) => {
      if (!value || Object.keys(value).length === 0) {
        throw new Error("At least one field is required.");
      }

      const allowedFields = [
        "categoryName",
        "description",
        "status"
      ];

      const invalidFields = Object.keys(value).filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        throw new Error(
          `Invalid fields: ${invalidFields.join(", ")}`
        );
      }

      return true;
    }),

  body("categoryName")
    .optional()
    .isString()
    .withMessage("Category name must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Category name must be between 3 and 100 characters."),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters."),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive.")
];

const getCategoriesValidator = [
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Invalid category status."),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters.")
];

module.exports = {
  createCategoryValidator,
  categoryIdValidator,
  updateCategoryValidator,
  getCategoriesValidator
};
