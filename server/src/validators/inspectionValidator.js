const { body } = require("express-validator");

const createInspectionValidator = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("inspectorId")
    .notEmpty()
    .withMessage("Inspector ID is required")
    .isMongoId()
    .withMessage("Invalid inspector ID"),

  body("scheduledDate")
    .notEmpty()
    .withMessage("Scheduled date is required")
    .isISO8601()
    .withMessage("Scheduled date must be a valid date"),

  body("inspectionType")
    .optional()
    .isIn(["routine", "follow_up", "complaint", "special"])
    .withMessage("Invalid inspection type"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 2000 })
    .withMessage("Notes cannot exceed 2000 characters")
];

const completeInspectionValidator = [
  body("findings")
    .notEmpty()
    .withMessage("Inspection findings are required")
    .isString()
    .withMessage("Findings must be a string")
    .isLength({ max: 5000 })
    .withMessage("Findings cannot exceed 5000 characters"),

  body("result")
    .notEmpty()
    .withMessage("Inspection result is required")
    .isIn(["compliant", "violation_found"])
    .withMessage("Invalid inspection result"),

  body("checklist")
    .optional()
    .isArray()
    .withMessage("Checklist must be an array"),

  body("checklist.*.item")
    .if(body("checklist").exists())
    .notEmpty()
    .withMessage("Checklist item is required"),

  body("checklist.*.passed")
    .if(body("checklist").exists())
    .isBoolean()
    .withMessage("Checklist passed must be true or false"),

  body("evidenceImages")
    .optional()
    .isArray()
    .withMessage("Evidence images must be an array"),

  body("evidenceImages.*")
    .optional()
    .isString()
    .withMessage("Each evidence image must be a string")
];

module.exports = {
  createInspectionValidator,
  completeInspectionValidator
};