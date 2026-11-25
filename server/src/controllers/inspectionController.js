const mongoose = require("mongoose");

const Inspection = require("../models/Inspection");
const Property = require("../models/Property");
const User = require("../models/User");

// Check whether user can access an inspection
const canAccessInspection = (user, inspection) => {
  if (["admin", "board_member"].includes(user.role)) {
    return true;
  }

  if (user.role === "inspector") {
    return inspection.inspector.toString() === user._id.toString();
  }

  return false;
};

// POST: Create Inspection and Assign Inspector
const createInspection = async (req, res, next) => {
  try {
    const { propertyId, inspectorId, scheduledDate, inspectionType, notes } =
      req.body;

    if (
      !mongoose.Types.ObjectId.isValid(propertyId) ||
      !mongoose.Types.ObjectId.isValid(inspectorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property or inspector ID"
      });
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    const inspector = await User.findOne({
      _id: inspectorId,
      role: "inspector"
    });

    if (!inspector) {
      return res.status(404).json({
        success: false,
        message: "Inspector not found"
      });
    }

    const date = new Date(scheduledDate);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be a valid future date"
      });
    }

    const inspection = await Inspection.create({
      property: property._id,
      inspector: inspector._id,
      createdBy: req.user._id,
      scheduledDate: date,
      inspectionType: inspectionType || "routine",
      notes: notes || ""
    });

    // Keep the property's assigned inspector in sync
    property.assignedInspector = inspector._id;
    await property.save();

    const populatedInspection = await Inspection.findById(inspection._id)
      .populate("property", "propertyName propertyNumber address")
      .populate("inspector", "fullName email")
      .populate("createdBy", "fullName email");

    return res.status(201).json({
      success: true,
      message: "Inspection created and inspector assigned successfully",
      data: populatedInspection
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get All Inspections
const getAllInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find()
      .populate("property", "propertyName propertyNumber address")
      .populate("inspector", "fullName email")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get Logged-in Inspector's Inspections
const getMyInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find({
      inspector: req.user._id
    })
      .populate("property", "propertyName propertyNumber address")
      .populate("createdBy", "fullName email")
      .sort({ scheduledDate: 1 });

    return res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get Single Inspection
const getInspectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID"
      });
    }

    const inspection = await Inspection.findById(id)
      .populate("property", "propertyName propertyNumber address owner")
      .populate("inspector", "fullName email")
      .populate("createdBy", "fullName email");

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found"
      });
    }

    if (!canAccessInspection(req.user, inspection)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this inspection"
      });
    }

    return res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Start Inspection
const startInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID"
      });
    }

    const inspection = await Inspection.findById(id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found"
      });
    }

    if (!canAccessInspection(req.user, inspection)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to start this inspection"
      });
    }

    if (inspection.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled inspections can be started"
      });
    }

    inspection.status = "in_progress";
    inspection.startedAt = new Date();

    await inspection.save();

    return res.status(200).json({
      success: true,
      message: "Inspection started successfully",
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Complete Inspection and Submit Report
const completeInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { findings, result, checklist, evidenceImages } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID"
      });
    }

    const inspection = await Inspection.findById(id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found"
      });
    }

    if (!canAccessInspection(req.user, inspection)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to complete this inspection"
      });
    }

    if (inspection.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Only in-progress inspections can be completed"
      });
    }

    inspection.findings = findings;
    inspection.result = result;
    inspection.checklist = checklist || [];
    inspection.evidenceImages = evidenceImages || [];
    inspection.status = "completed";
    inspection.completedAt = new Date();

    await inspection.save();

    return res.status(200).json({
      success: true,
      message: "Inspection completed successfully",
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Cancel Inspection
const cancelInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID"
      });
    }

    const inspection = await Inspection.findById(id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found"
      });
    }

    if (!["admin", "board_member"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin or board member can cancel inspections"
      });
    }

    if (["completed", "cancelled"].includes(inspection.status)) {
      return res.status(400).json({
        success: false,
        message: "This inspection cannot be cancelled"
      });
    }

    inspection.status = "cancelled";
    await inspection.save();

    return res.status(200).json({
      success: true,
      message: "Inspection cancelled successfully",
      data: inspection
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInspection,
  getAllInspections,
  getMyInspections,
  getInspectionById,
  startInspection,
  completeInspection,
  cancelInspection
};