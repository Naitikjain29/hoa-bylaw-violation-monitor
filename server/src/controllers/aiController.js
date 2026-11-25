
const mongoose = require("mongoose");

const Violation = require("../models/Violation");
const { analyzeViolationImage } = require("../services/aiService");

// Check user access permission
const canAnalyzeViolation = (user, violation) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "inspector") {
    return (
      violation.property.assignedInspector &&
      violation.property.assignedInspector.toString() ===
        user._id.toString()
    );
  }

  // Original reporter can analyze their violation
  return (
    violation.reportedBy._id.toString() === user._id.toString()
  );
};

// POST: Analyze Violation Image
const analyzeViolation = async (req, res, next) => {
  try {
    const { violationId } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(violationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation ID"
      });
    }

    // Check uploaded image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an evidence image"
      });
    }

    // Find violation
    const violation = await Violation.findById(violationId)
      .populate({
        path: "property",
        select: "propertyName owner assignedInspector"
      })
      .populate("reportedBy", "fullName email");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found"
      });
    }

    // Check required references
    if (!violation.property || !violation.reportedBy) {
      return res.status(400).json({
        success: false,
        message: "Violation property or reporter information is missing"
      });
    }

    // Check authorization
    if (!canAnalyzeViolation(req.user, violation)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to analyze this violation"
      });
    }

    // Analyze image using Gemini
    const aiResult = await analyzeViolationImage(
      req.file.buffer,
      req.file.mimetype
    );

    // Validate AI result
    if (
      typeof aiResult.isViolationDetected !== "boolean" ||
      typeof aiResult.suggestion !== "string" ||
      typeof aiResult.confidence !== "number" ||
      !["low", "medium", "high", "critical"].includes(aiResult.severity)
    ) {
      throw new Error("Invalid AI analysis result");
    }

    // Save complete AI analysis
    violation.aiAnalysis = {
      isViolationDetected: aiResult.isViolationDetected,
      suggestion: aiResult.suggestion,
      severity: aiResult.severity,
      confidence: aiResult.confidence,
      observations: aiResult.observations || "",
      reason: aiResult.reason || "",
      recommendation: aiResult.recommendation || "",
      analyzedAt: new Date()
    };

    await violation.save();

    return res.status(200).json({
      success: true,
      message: "Violation image analyzed successfully",
      data: {
        violationId: violation._id,
        aiAnalysis: violation.aiAnalysis
      }
    });

  } catch (error) {
    console.error("Analyze Violation Error:", error.message);
    next(error);
  }
};

// GET: Get Saved AI Analysis
const getAIAnalysis = async (req, res, next) => {
  try {
    const { violationId } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(violationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation ID"
      });
    }

    // Find violation
    const violation = await Violation.findById(violationId)
      .populate({
        path: "property",
        select: "propertyName owner assignedInspector"
      })
      .populate("reportedBy", "fullName email");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found"
      });
    }

    if (!violation.property || !violation.reportedBy) {
      return res.status(400).json({
        success: false,
        message: "Violation property or reporter information is missing"
      });
    }

    // Check authorization
    if (!canAnalyzeViolation(req.user, violation)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this AI analysis"
      });
    }

    // Check saved analysis
    if (!violation.aiAnalysis || !violation.aiAnalysis.analyzedAt) {
      return res.status(404).json({
        success: false,
        message: "AI analysis not found. Please analyze an image first."
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI analysis fetched successfully",
      data: {
        violationId: violation._id,
        aiAnalysis: violation.aiAnalysis
      }
    });

  } catch (error) {
    console.error("Get AI Analysis Error:", error.message);
    next(error);
  }
};

module.exports = {
  analyzeViolation,
  getAIAnalysis
};
