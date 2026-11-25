
const errorMiddleware = (error, req, res, next) => {
  console.error("ERROR:", error);

  // Mongoose Validation Error
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message
      }))
    });
  }

  // MongoDB Duplicate Key Error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";

    return res.status(409).json({
      success: false,
      message: `${field} already exists.`
    });
  }

  // Invalid MongoDB ID
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID."
    });
  }

  // Multer File Upload Errors
  if (error.name === "MulterError") {
    let message = error.message;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Image size cannot exceed 5 MB.";
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      message = "Only one image can be uploaded at a time.";
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  // Invalid Image Format
  if (
    error.message &&
    error.message.includes("Only JPG, JPEG, PNG and WEBP")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Gemini API Errors
  if (
    error.status >= 400 ||
    error.statusCode >= 400
  ) {
    return res.status(502).json({
      success: false,
      message: "AI service failed. Please try again later."
    });
  }

  // General Server Error
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error."
        : error.message
  });
};

module.exports = errorMiddleware;
