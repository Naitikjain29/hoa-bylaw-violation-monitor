
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createNotice,
  getAllNotices,
  getMyNotices,
  downloadNoticePDF
} = require("../controllers/noticeController");

// All routes require authentication
router.use(protect);

// Admin and board member: Create notice
router.post(
  "/violation/:violationId",
  authorizeRoles("admin", "board_member"),
  createNotice
);

// Homeowner: Get own notices
router.get(
  "/my",
  authorizeRoles("homeowner"),
  getMyNotices
);

// Admin and board member: Get all notices
router.get(
  "/",
  authorizeRoles("admin", "board_member"),
  getAllNotices
);

// Admin, board member or relevant homeowner: Download PDF
router.get(
  "/:id/pdf",
  downloadNoticePDF
);

module.exports = router;
