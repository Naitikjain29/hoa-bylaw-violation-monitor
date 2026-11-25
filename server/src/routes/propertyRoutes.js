const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateMiddleware");

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  assignProperty,
  deleteProperty
} = require("../controllers/propertyController");

const {
  createPropertyValidator,
  propertyIdValidator,
  assignPropertyValidator
} = require("../validators/propertyValidator");

router.use(protect);

router.get("/", getAllProperties);

router.post(
  "/",
  authorizeRoles("admin"),
  createPropertyValidator,
  validateRequest,
  createProperty
);

router.get(
  "/:id",
  propertyIdValidator,
  validateRequest,
  getPropertyById
);

router.put(
  "/:id",
  authorizeRoles("admin"),
  propertyIdValidator,
  validateRequest,
  updateProperty
);

router.patch(
  "/:id/assign",
  authorizeRoles("admin"),
  propertyIdValidator,
  assignPropertyValidator,
  validateRequest,
  assignProperty
);

router.delete(
  "/:id",
  authorizeRoles("admin"),
  propertyIdValidator,
  validateRequest,
  deleteProperty
);

module.exports = router;
