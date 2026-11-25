const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateMiddleware");

const {
  createInspectionValidator,
  completeInspectionValidator
} = require("../validators/inspectionValidator");

const {
  createInspection,
  getAllInspections,
  getMyInspections,
  getInspectionById,
  startInspection,
  completeInspection,
  cancelInspection
} = require("../controllers/inspectionController");

router.use(protect);

// Admin / Board Member
router.post(
  "/",
  authorizeRoles("admin", "board_member"),
  createInspectionValidator,
  validateRequest,
  createInspection
);

// Inspector: Own inspections
router.get(
  "/my",
  authorizeRoles("inspector"),
  getMyInspections
);

// Admin / Board Member: All inspections
router.get(
  "/",
  authorizeRoles("admin", "board_member"),
  getAllInspections
);

// Start inspection
router.patch(
  "/:id/start",
  authorizeRoles("admin", "inspector"),
  startInspection
);

// Complete inspection
router.patch(
  "/:id/complete",
  authorizeRoles("admin", "inspector"),
  completeInspectionValidator,
  validateRequest,
  completeInspection
);

// Cancel inspection
router.patch(
  "/:id/cancel",
  authorizeRoles("admin", "board_member"),
  cancelInspection
);

// Single inspection
router.get(
  "/:id",
  authorizeRoles("admin", "board_member", "inspector"),
  getInspectionById
);

module.exports = router;