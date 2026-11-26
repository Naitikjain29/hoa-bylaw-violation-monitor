
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const violationRoutes = require("./routes/violationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// ERROR MIDDLEWARE
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// GLOBAL MIDDLEWARE

const allowedOrigins = [
  "http://localhost:3000",
  "https://hoa-bylaw-violation-monitor-syc1.vercel.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// STATIC FILES
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HOA Bylaw Violation Monitor API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// GLOBAL ERROR HANDLER
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("HOA Backend Server Started");
      console.log(`Port: ${PORT}`);
      console.log(
        `Environment: ${process.env.NODE_ENV || "development"}`
      );
      console.log(`URL: http://localhost:${PORT}`);
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
