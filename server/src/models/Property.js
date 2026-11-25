const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    propertyName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100
    },
    propertyNumber: {
      type: String,
      required: [true, "Property number is required"],
      trim: true,
      uppercase: true
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, required: true, trim: true }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedInspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    propertyType: {
      type: String,
      enum: ["single_family", "townhouse", "condominium", "other"],
      default: "single_family"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },
    images: [{ type: String }]
  },
  { timestamps: true }
);

// Property number is unique within this single-HOA MVP.
propertySchema.index({ propertyNumber: 1 }, { unique: true });
propertySchema.index({ owner: 1 });
propertySchema.index({ assignedInspector: 1 });

module.exports = mongoose.model("Property", propertySchema);
