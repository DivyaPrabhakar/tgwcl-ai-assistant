// routes/index.js - Refactored for modularity and maintainability
const express = require("express");
const { WARDROBE_CONFIG } = require("../config/constants");
const DEMO_CONFIG = require("../config/demoConfig");

// Import route modules
const demoRoutes = require("./modules/demoRoutes");
const healthRoutes = require("./modules/healthRoutes");
const statusRoutes = require("./modules/statusRoutes");
const wardrobeRoutes = require("./modules/wardrobeRoutes");
const analyticsRoutes = require("./modules/analyticsRoutes");
const debugRoutes = require("./modules/debugRoutes");
const chatRoutes = require("./modules/chatRoutes");

const router = express.Router();

// Middleware
const {
  asyncHandler,
  validateRefreshParam,
  validateStatusFilter,
} = require("./middleware/validation");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");

function createRoutes(wardrobeService, aiService) {
  // Attach services to router for access in route modules
  router.wardrobeService = wardrobeService;
  router.aiService = aiService;

  // === ROUTE MODULES ===

  // Demo routes
  router.use("/demo", demoRoutes());

  // Health and system routes
  router.use("/", healthRoutes(wardrobeService));

  // Status management routes
  router.use("/wardrobe", statusRoutes(wardrobeService));

  // Core wardrobe data routes
  router.use("/wardrobe", wardrobeRoutes(wardrobeService));

  // Analytics routes
  router.use("/wardrobe", analyticsRoutes(wardrobeService));

  // Debug routes
  router.use("/debug", debugRoutes(wardrobeService));

  // Chat routes
  router.use("/", chatRoutes(wardrobeService, aiService));

  // === ERROR HANDLING ===
  router.use(errorHandler);
  router.use("*", notFoundHandler);

  return router;
}

module.exports = createRoutes;
