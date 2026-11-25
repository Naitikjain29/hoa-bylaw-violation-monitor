const { body, param } = require("express-validator");

const createPropertyValidator = [
  body("propertyName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 }).withMessage("Property name cannot exceed 100 characters"),
  body("propertyNumber")
    .trim()
    .notEmpty().withMessage("Property number is required"),
  body("address.street")
    .trim()
    .notEmpty().withMessage("Street address is required"),
  body("address.city")
    .trim()
    .notEmpty().withMessage("City is required"),
  body("address.state")
    .trim()
    .notEmpty().withMessage("State is required"),
  body("address.zipCode")
    .trim()
    .notEmpty().withMessage("ZIP code is required"),
  body("owner")
    .isMongoId().withMessage("A valid homeowner ID is required"),
  body("assignedInspector")
    .optional({ values: "null" })
    .isMongoId().withMessage("A valid inspector ID is required"),
  body("propertyType")
    .optional()
    .isIn(["single_family", "townhouse", "condominium", "other"])
    .withMessage("Invalid property type"),
  body("description")
    .optional({ values: "falsy" })
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),
  body("images")
    .optional()
    .isArray().withMessage("Images must be an array")
];

const propertyIdValidator = [
  param("id").isMongoId().withMessage("Invalid property ID")
];

const assignPropertyValidator = [
  body("owner")
    .optional({ values: "null" })
    .isMongoId().withMessage("Invalid homeowner ID"),
  body("assignedInspector")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || /^[a-fA-F0-9]{24}$/.test(value))
    .withMessage("Invalid inspector ID")
];

module.exports = {
  createPropertyValidator,
  propertyIdValidator,
  assignPropertyValidator
};
