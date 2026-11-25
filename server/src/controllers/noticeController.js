
const mongoose = require("mongoose");
const crypto = require("crypto");

const Notice = require("../models/Notice");
const Violation = require("../models/Violation");

const { generateNoticePDF } = require("../services/noticeService");

// Generate unique notice number
const generateNoticeNumber = () => {
  return `HOA-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

// Check whether user can access a notice
const canAccessNotice = (user, notice) => {
  if (["admin", "board_member"].includes(user.role)) {
    return true;
  }

  if (user.role === "homeowner") {
    return notice.homeowner.toString() === user._id.toString();
  }

  return false;
};

// POST: Create Notice
const createNotice = async (req, res, next) => {
  try {
    const { violationId } = req.params;
    const { subject, message, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(violationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid violation ID"
      });
    }

    // Find violation and populate related details
    const violation = await Violation.findById(violationId)
      .populate({
        path: "property",
        populate: {
          path: "owner",
          select: "fullName email"
        }
      })
      .populate("category", "categoryName");

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violation not found"
      });
    }

    // Only confirmed violations can receive notices
    if (violation.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Notice can only be generated for confirmed violations"
      });
    }

    const property = violation.property;

    if (!property || !property.owner) {
      return res.status(400).json({
        success: false,
        message: "Property or homeowner information is missing"
      });
    }

    const homeowner = property.owner;

    // Validate due date
    let finalDueDate;

    if (dueDate) {
      finalDueDate = new Date(dueDate);

      if (
        Number.isNaN(finalDueDate.getTime()) ||
        finalDueDate <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Due date must be a valid future date"
        });
      }
    } else {
      finalDueDate = new Date();
      finalDueDate.setDate(finalDueDate.getDate() + 14);
    }

    // Create notice
    const notice = await Notice.create({
      noticeNumber: generateNoticeNumber(),

      violation: violation._id,
      property: property._id,
      homeowner: homeowner._id,
      issuedBy: req.user._id,

      propertyName: property.propertyName,
      propertyNumber: property.propertyNumber || "",
      propertyAddress: property.address,

      homeownerName: homeowner.fullName,
      homeownerEmail: homeowner.email || "",

      categoryName: violation.category
        ? violation.category.categoryName
        : "",

      violationDescription: violation.description,
      severity: violation.severity,

      subject:
        subject || "Official HOA Bylaw Violation Notice",

      message:
        message ||
        "Our records indicate a possible violation of HOA community rules. Please review the violation details and take corrective action before the due date.",

      dueDate: finalDueDate
    });

    return res.status(201).json({
      success: true,
      message: "Violation notice created successfully",
      data: {
        notice
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET: Get All Notices
const getAllNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find()
      .populate("issuedBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });

  } catch (error) {
    next(error);
  }
};

// GET: Get Homeowner's Own Notices
const getMyNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find({
      homeowner: req.user._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });

  } catch (error) {
    next(error);
  }
};

// GET: Download Notice PDF
const downloadNoticePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notice ID"
      });
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found"
      });
    }

    if (!canAccessNotice(req.user, notice)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this notice"
      });
    }

    return generateNoticePDF(notice, res);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotice,
  getAllNotices,
  getMyNotices,
  downloadNoticePDF
};
