
const { body } = require("express-validator");

const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters"),

  body("phone")
    .optional({ values: "falsy" })
    .isMobilePhone()
    .withMessage("Enter a valid phone number")
];

const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

module.exports = {
  registerValidator,
  loginValidator
};
