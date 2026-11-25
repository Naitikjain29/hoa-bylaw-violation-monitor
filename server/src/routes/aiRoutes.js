
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const aiUpload = require("../middleware/aiUpload");

const {
  analyzeViolation,
  getAIAnalysis
} = require("../controllers/aiController");

// All AI routes require authentication
router.use(protect);

// Analyze violation evidence image
router.post(
  "/analyze/:violationId",
  aiUpload.single("evidenceImage"),
  analyzeViolation
);

// Get saved AI analysis
router.get(
  "/result/:violationId",
  getAIAnalysis
);

module.exports = router;
