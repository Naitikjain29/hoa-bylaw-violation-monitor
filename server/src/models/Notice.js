
const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    noticeNumber: {
      type: String,
      required: true,
      unique: true
    },

    violation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Violation",
      required: true
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true
    },

    homeowner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Property snapshot
    propertyName: {
      type: String,
      required: true
    },

    propertyNumber: {
      type: String,
      default: ""
    },

    propertyAddress: {
      type: String,
      required: true
    },

    // Homeowner snapshot
    homeownerName: {
      type: String,
      required: true
    },

    homeownerEmail: {
      type: String,
      default: ""
    },

    // Violation snapshot
    categoryName: {
      type: String,
      default: ""
    },

    violationDescription: {
      type: String,
      required: true
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    dueDate: {
      type: Date,
      required: true
    },

    issuedAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["issued", "acknowledged", "closed"],
      default: "issued"
    }
  },
  {
    timestamps: true
  }
);

noticeSchema.index({ violation: 1 });
noticeSchema.index({ homeowner: 1 });
noticeSchema.index({ status: 1 });

module.exports = mongoose.model("Notice", noticeSchema);
