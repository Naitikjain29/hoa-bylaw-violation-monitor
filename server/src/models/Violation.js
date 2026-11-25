
const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"]
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Violation category is required"]
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"]
    },

    description: {
      type: String,
      required: [true, "Violation description is required"],
      trim: true,
      minlength: 10,
      maxlength: 3000
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },

    evidenceImages: {
      type: [String],
      default: []
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },

    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "confirmed",
        "dismissed",
        "resolved"
      ],
      default: "pending"
    },

    // GEMINI AI ANALYSIS
    aiAnalysis: {
      isViolationDetected: {
        type: Boolean,
        default: null
      },

      suggestion: {
        type: String,
        default: ""
      },

      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical", null],
        default: null
      },

      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: null
      },

      observations: {
        type: String,
        default: ""
      },

      reason: {
        type: String,
        default: ""
      },

      recommendation: {
        type: String,
        default: ""
      },

      analyzedAt: {
        type: Date,
        default: null
      }
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    reviewDecision: {
      type: String,
      enum: ["confirmed", "dismissed", null],
      default: null
    },

    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// INDEXES
violationSchema.index({ property: 1 });
violationSchema.index({ category: 1 });
violationSchema.index({ reportedBy: 1 });
violationSchema.index({ status: 1 });
violationSchema.index({ reviewedBy: 1 });

module.exports = mongoose.model("Violation", violationSchema);
