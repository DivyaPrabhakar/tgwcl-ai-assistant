// routes/modules/analyticsRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const {
  asyncHandler,
  validateRefreshParam,
} = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService) => {
  router.get(
    "/analytics",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const analytics = await wardrobeService.analyzeUsagePatterns(
        req.forceRefresh
      );
      res.json({
        ...analytics,
        generatedAt: new Date().toISOString(),
        cacheUsed: !req.forceRefresh,
        demoMode: DEMO_CONFIG.DEMO_MODE,
      });
    })
  );

  router.get(
    "/cost-analysis",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const costAnalysis = await wardrobeService.getCostAnalysis(
        req.forceRefresh
      );
      res.json({
        ...costAnalysis,
        generatedAt: new Date().toISOString(),
        cacheUsed: !req.forceRefresh,
        demoMode: DEMO_CONFIG.DEMO_MODE,
      });
    })
  );

  return router;
};
