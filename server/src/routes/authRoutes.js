
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMyProfile
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");

const {
  registerValidator,
  loginValidator
} = require("../validators/authValidator");

// POST /api/auth/register
router.post(
  "/register",
  registerValidator,
  validateRequest,
  registerUser
);

// POST /api/auth/login
router.post(
  "/login",
  loginValidator,
  validateRequest,
  loginUser
);

// GET /api/auth/me
router.get(
  "/me",
  protect,
  getMyProfile
);

module.exports = router;
