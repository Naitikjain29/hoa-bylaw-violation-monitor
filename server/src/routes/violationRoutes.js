
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const violationUpload = require("../middleware/violationUpload");

const {
  createViolation,
  getAllViolations,
  getViolationById,
  updateViolation,
  startViolationReview,
  reviewViolation,
  resolveViolation
} = require("../controllers/violationController");

const {
  createViolationValidator,
  violationIdValidator,
  updateViolationValidator,
  reviewViolationValidator,
  resolveViolationValidator,
  getViolationsValidator
} = require("../validators/violationValidator");

router.use(protect);

router.post(
  "/",
  authorizeRoles("admin", "inspector", "homeowner"),
  violationUpload.array("evidenceImages", 5),
  createViolationValidator,
  validateRequest,
  createViolation
);

router.get(
  "/",
  getViolationsValidator,
  validateRequest,
  getAllViolations
);

router.get(
  "/:id",
  violationIdValidator,
  validateRequest,
  getViolationById
);

router.put(
  "/:id",
  updateViolationValidator,
  validateRequest,
  updateViolation
);

router.patch(
  "/:id/start-review",
  authorizeRoles("admin", "inspector"),
  violationIdValidator,
  validateRequest,
  startViolationReview
);

router.patch(
  "/:id/review",
  authorizeRoles("admin", "inspector"),
  reviewViolationValidator,
  validateRequest,
  reviewViolation
);

router.patch(
  "/:id/resolve",
  authorizeRoles("admin", "inspector"),
  resolveViolationValidator,
  validateRequest,
  resolveViolation
);

module.exports = router;
