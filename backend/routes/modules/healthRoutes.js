// routes/modules/healthRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const { asyncHandler } = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService) => {
  router.get(
    "/health",
    asyncHandler(async (req, res) => {
      const healthCheck = await wardrobeService.healthCheck();
      healthCheck.demoMode = DEMO_CONFIG.DEMO_MODE;
      healthCheck.publicDemo = DEMO_CONFIG.DEMO_MODE;

      res
        .status(healthCheck.status === "healthy" ? 200 : 503)
        .json(healthCheck);
    })
  );

  router.get(
    "/cache-status",
    asyncHandler(async (req, res) => {
      const status = wardrobeService.getCacheStatus();
      res.json({
        cacheStatus: status,
        demoMode: DEMO_CONFIG.DEMO_MODE,
        summary: {
          totalTables: Object.keys(status).length,
          tablesWithData: Object.values(status).filter((s) => s.recordCount > 0)
            .length,
          totalRecords: Object.values(status).reduce(
            (sum, s) => sum + s.recordCount,
            0
          ),
        },
      });
    })
  );

  router.get("/config", (req, res) => {
    const wardrobeConfig = wardrobeService.getWardrobeConfig();

    res.json({
      wardrobeConfig,
      demoMode: DEMO_CONFIG.DEMO_MODE,
      demoFeatures: DEMO_CONFIG.DEMO_MODE ? DEMO_CONFIG.DEMO_FEATURES : null,
      apiVersion: "2.0.0",
      features: [
        "status-based-filtering",
        "enhanced-analytics",
        "cost-analysis",
        "real-time-filtering",
        DEMO_CONFIG.DEMO_MODE ? "demo-mode" : "full-mode",
      ],
    });
  });

  return router;
};
