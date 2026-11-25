
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false
    },

    phone: {
      type: String,
      trim: true,
      default: ""
    },

    role: {
      type: String,
      enum: [
        "admin",
        "inspector",
        "board_member",
        "homeowner"
      ],
      default: "homeowner"
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    profileImage: {
      type: String,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
