
const { body, param, query } = require("express-validator");

const createViolationValidator = [
  body("property")
    .isMongoId()
    .withMessage("A valid property ID is required."),

  body("category")
    .isMongoId()
    .withMessage("A valid category ID is required."),

  body("description")
    .isString()
    .withMessage("Description must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Description is required.")
    .isLength({ min: 10, max: 3000 })
    .withMessage("Description must be between 10 and 3000 characters."),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string.")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters."),

  body("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid severity.")
];

const violationIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("A valid violation ID is required.")
];

const updateViolationValidator = [
  ...violationIdValidator,

  body()
    .custom((value) => {
      if (!value || Object.keys(value).length === 0) {
        throw new Error("At least one field is required.");
      }

      const allowed = [
        "description",
        "location",
        "severity"
      ];

      const invalid = Object.keys(value).filter(
        field => !allowed.includes(field)
      );

      if (invalid.length) {
        throw new Error(`Invalid fields: ${invalid.join(", ")}`);
      }

      return true;
    }),

  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage("Description must be between 10 and 3000 characters."),

  body("location")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters."),

  body("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid severity.")
];

const reviewViolationValidator = [
  ...violationIdValidator,

  body("decision")
    .isIn(["confirmed", "dismissed"])
    .withMessage("Decision must be confirmed or dismissed."),

  body("reviewNotes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Review notes cannot exceed 2000 characters.")
];

const resolveViolationValidator = [
  ...violationIdValidator
];

const getViolationsValidator = [
  query("status")
    .optional()
    .isIn([
      "pending",
      "under_review",
      "confirmed",
      "dismissed",
      "resolved"
    ])
    .withMessage("Invalid violation status."),

  query("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid severity.")
];

module.exports = {
  createViolationValidator,
  violationIdValidator,
  updateViolationValidator,
  reviewViolationValidator,
  resolveViolationValidator,
  getViolationsValidator
};
