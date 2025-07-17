// routes/middleware/errorHandlers.js
const DEMO_CONFIG = require("../../config/demoConfig");

const errorHandler = (error, req, res, next) => {
  console.error("❌ Route error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: error.message,
      demoMode: DEMO_CONFIG.DEMO_MODE,
    });
  }

  if (error.message.includes("Airtable")) {
    return res.status(503).json({
      error: "External service unavailable",
      details: "Unable to fetch data from Airtable",
      retryAfter: 30,
      demoMode: DEMO_CONFIG.DEMO_MODE,
    });
  }

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] || "unknown",
    demoMode: DEMO_CONFIG.DEMO_MODE,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
    demoMode: DEMO_CONFIG.DEMO_MODE,
    availableEndpoints: [
      "GET /api/health",
      "GET /api/demo/info",
      "GET /api/demo/chat-history",
      "GET /api/wardrobe/statuses",
      "GET /api/wardrobe/active-items",
      "GET /api/wardrobe/analytics",
      "GET /api/wardrobe/cost-analysis",
      "POST /api/chat" + (DEMO_CONFIG.DEMO_MODE ? " (disabled in demo)" : ""),
    ],
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
