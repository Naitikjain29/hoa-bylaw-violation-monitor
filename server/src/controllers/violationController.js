
const mongoose = require("mongoose");

const Violation = require("../models/Violation");
const Property = require("../models/Property");
const Category = require("../models/Category");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const canAccessProperty = (user, property) => {
  if (user.role === "admin" || user.role === "board_member") {
    return true;
  }

  if (user.role === "homeowner") {
    return property.owner.toString() === user._id.toString();
  }

  if (user.role === "inspector") {
    return (
      property.assignedInspector &&
      property.assignedInspector.toString() === user._id.toString()
    );
  }

  return false;
};

const canReviewProperty = (user, property) => {
  if (user.role === "admin") return true;

  return (
    user.role === "inspector" &&
    property.assignedInspector &&
    property.assignedInspector.toString() === user._id.toString()
  );
};

// CREATE VIOLATION
const createViolation = async (req, res, next) => {
  try {
    const { property, category, description, location, severity } = req.body;

    const propertyData = await Property.findById(property);

    if (!propertyData || propertyData.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Active property not found."
      });
    }

    if (!canAccessProperty(req.user, propertyData)) {
      return res.status(403).json({
        success: false,
        message: "You cannot report a violation for this property."
      });
    }

    const categoryData = await Category.findOne({
      _id: category,
      status: "active"
    });

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Active violation category not found."
      });
    }

    const evidenceImages = (req.files || []).map(
      file => `/uploads/violations/${file.filename}`
    );

    const violation = await Violation.create({
      property,
      category,
      reportedBy: req.user._id,
      description,
      location: location || "",
      severity: severity || "medium",
      evidenceImages
    });

    const populated = await Violation.findById(violation._id)
      .populate("property", "propertyName propertyNumber address owner assignedInspector")
      .populate("category", "categoryName description")
      .populate("reportedBy", "fullName email");

    return res.status(201).json({
      success: true,
      message: "Violation reported successfully.",
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL VIOLATIONS
const getAllViolations = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;

    if (req.user.role === "homeowner") {
      const properties = await Property.find({
        owner: req.user._id
      }).select("_id");

      filter.property = { $in: properties.map(p => p._id) };
    } else if (req.user.role === "inspector") {
      const properties = await Property.find({
        assignedInspector: req.user._id
      }).select("_id");

      filter.property = { $in: properties.map(p => p._id) };
    }

    const violations = await Violation.find(filter)
      .populate("property", "propertyName propertyNumber")
      .populate("category", "categoryName")
      .populate("reportedBy", "fullName email")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: violations.length,
      data: violations
    });
  } catch (error) {
    next(error);
  }
};

// GET VIOLATION BY ID
const getViolationById = async (req, res, next) => {
  try {
    const violation = await Violation.findById(req.params.id)
      .populate("property", "propertyName propertyNumber address owner assignedInspector")
      .populate("category", "categoryName description")
      .populate("reportedBy", "fullName email")
      .populate("reviewedBy", "fullName email");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found."
      });
    }

    if (!canAccessProperty(req.user, violation.property)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this violation."
      });
    }

    return res.status(200).json({
      success: true,
      data: violation
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE VIOLATION DETAILS
const updateViolation = async (req, res, next) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found."
      });
    }

    const property = await Property.findById(violation.property);

    if (!property || !canAccessProperty(req.user, property)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this violation."
      });
    }

    if (
      req.user.role !== "admin" &&
      violation.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the reporter or admin can update this violation."
      });
    }

    if (violation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending violations can be edited."
      });
    }

    ["description", "location", "severity"].forEach(field => {
      if (req.body[field] !== undefined) {
        violation[field] = req.body[field];
      }
    });

    await violation.save();

    return res.status(200).json({
      success: true,
      message: "Violation updated successfully.",
      data: violation
    });
  } catch (error) {
    next(error);
  }
};

// MARK AS UNDER REVIEW
const startViolationReview = async (req, res, next) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found."
      });
    }

    const property = await Property.findById(violation.property);

    if (!property || !canReviewProperty(req.user, property)) {
      return res.status(403).json({
        success: false,
        message: "You cannot review this property's violation."
      });
    }

    if (!["pending", "under_review"].includes(violation.status)) {
      return res.status(400).json({
        success: false,
        message: "This violation cannot be moved to review."
      });
    }

    violation.status = "under_review";
    await violation.save();

    return res.status(200).json({
      success: true,
      message: "Violation moved to under review.",
      data: violation
    });
  } catch (error) {
    next(error);
  }
};

// HUMAN REVIEW: CONFIRM OR DISMISS
const reviewViolation = async (req, res, next) => {
  try {
    const { decision, reviewNotes } = req.body;

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found."
      });
    }

    const property = await Property.findById(violation.property);

    if (!property || !canReviewProperty(req.user, property)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to review this violation."
      });
    }

    if (!["pending", "under_review"].includes(violation.status)) {
      return res.status(400).json({
        success: false,
        message: "This violation has already been reviewed."
      });
    }

    violation.status = decision;
    violation.reviewDecision = decision;
    violation.reviewedBy = req.user._id;
    violation.reviewedAt = new Date();
    violation.reviewNotes = reviewNotes || "";

    await violation.save();

    return res.status(200).json({
      success: true,
      message: `Violation ${decision} successfully.`,
      data: violation
    });
  } catch (error) {
    next(error);
  }
};

// RESOLVE CONFIRMED VIOLATION
const resolveViolation = async (req, res, next) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found."
      });
    }

    const property = await Property.findById(violation.property);

    if (!property || !canReviewProperty(req.user, property)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to resolve this violation."
      });
    }

    if (violation.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed violations can be resolved."
      });
    }

    violation.status = "resolved";
    violation.resolvedAt = new Date();

    await violation.save();

    return res.status(200).json({
      success: true,
      message: "Violation resolved successfully.",
      data: violation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createViolation,
  getAllViolations,
  getViolationById,
  updateViolation,
  startViolationReview,
  reviewViolation,
  resolveViolation
};
