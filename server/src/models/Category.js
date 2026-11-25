
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
      unique: true
    },

    description: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
      maxlength: 500
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ status: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
