const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const cluesRoutes = require("./routes/clues");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV || "development";

// Logging utility
const log = (level, message) => {
  console.log(`[${new Date().toISOString()}] [${level}] ${message}`);
};

log("INFO", `Starting server in ${nodeEnv} mode on port ${port}`);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (curl/postman) and same-origin requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-dev-uid"],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: nodeEnv
  });
});

// API routes (must come before static files)
app.use("/api", cluesRoutes);

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath, {
  maxAge: nodeEnv === "development" ? 0 : "1d"
}));

// Database connection with retry logic
const connectMongoDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/password_black_market";
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    log("INFO", "✅ MongoDB Connected successfully");
  } catch (err) {
    log("WARN", `MongoDB connection failed: ${err.message}`);
    if (nodeEnv === "production" && process.env.MONGO_REQUIRED === "true") {
      log("ERROR", "MongoDB is required in production (MONGO_REQUIRED=true). Exiting.");
      process.exit(1);
    }
    log("WARN", "Continuing without database - data features may be limited");
  }
};

connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  log("WARN", "MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  log("ERROR", `MongoDB error: ${err.message}`);
});

// Global error handler
app.use((err, req, res, next) => {
  log("ERROR", `${err.status || 500} - ${err.message}`);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ 
    error: message,
    status,
    ...(nodeEnv === "development" && { stack: err.stack })
  });
});

// SPA fallback - serve index.html for all unmatched routes
app.use((req, res) => {
  const indexPath = path.join(frontendBuildPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      log("ERROR", `Could not send index.html: ${err.message}`);
      res.status(500).json({ error: "Could not load application" });
    }
  });
});

// Start server
const server = app.listen(port, () => {
  log("INFO", `🚀 Server listening on port ${port}`);
  log("INFO", `Environment: ${nodeEnv}`);
  log("INFO", `CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("INFO", "SIGTERM received, shutting down gracefully");
  server.close(() => {
    log("INFO", "Server closed");
    mongoose.connection.close(false, () => {
      log("INFO", "MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  log("INFO", "SIGINT received, shutting down gracefully");
  server.close(() => {
    log("INFO", "Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  log("ERROR", `Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log("ERROR", `Unhandled Rejection at ${promise}: ${reason}`);
});
