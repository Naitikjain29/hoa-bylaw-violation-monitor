const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true
    },

    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    scheduledDate: {
      type: Date,
      required: true
    },

    inspectionType: {
      type: String,
      enum: ["routine", "follow_up", "complaint", "special"],
      default: "routine"
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    checklist: [
      {
        item: {
          type: String,
          required: true,
          trim: true
        },
        passed: {
          type: Boolean,
          default: false
        },
        remarks: {
          type: String,
          trim: true,
          default: ""
        }
      }
    ],

    findings: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },

    evidenceImages: {
      type: [String],
      default: []
    },

    result: {
      type: String,
      enum: ["pending", "compliant", "violation_found"],
      default: "pending"
    },

    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled"
    },

    startedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

inspectionSchema.index({ property: 1 });
inspectionSchema.index({ inspector: 1 });
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model("Inspection", inspectionSchema);