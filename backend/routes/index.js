// routes/index.js - Refactored with better error handling and validation
const express = require("express");
const { WARDROBE_CONFIG } = require("../config/constants");

const router = express.Router();

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware for request validation
const validateRefreshParam = (req, res, next) => {
  req.forceRefresh = req.query.refresh === "true";
  next();
};

const validateStatusFilter = (req, res, next) => {
  if (req.query.statuses) {
    const statuses = req.query.statuses
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    req.statusFilter = statuses;
  } else {
    req.statusFilter = [];
  }
  next();
};

function createRoutes(wardrobeService, aiService) {
  // === HEALTH AND SYSTEM ENDPOINTS ===

  router.get(
    "/health",
    asyncHandler(async (req, res) => {
      const healthCheck = await wardrobeService.healthCheck();
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
    res.json({
      wardrobeConfig: wardrobeService.getWardrobeConfig(),
      apiVersion: "2.0.0",
      features: [
        "status-based-filtering",
        "enhanced-analytics",
        "cost-analysis",
        "real-time-filtering",
      ],
    });
  });

  // === STATUS AND FILTERING ENDPOINTS ===

  router.get(
    "/wardrobe/statuses",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      // Force status configuration update if requested
      if (req.forceRefresh) {
        await wardrobeService.updateStatusConfiguration(true);
      }

      const [statuses, activeConfig] = await Promise.all([
        wardrobeService.getAllItemStatuses(req.forceRefresh),
        Promise.resolve(wardrobeService.getActiveStatusesConfig()),
      ]);

      res.json({
        allStatuses: statuses,
        activeStatusesConfig: activeConfig,
        statusCounts: statuses.length,
        lastUpdated: new Date().toISOString(),
        dynamicMatching: {
          matches: activeConfig.statusMatches || [],
          unmatchedStatuses: activeConfig.unmatchedStatuses || [],
          targetPatterns: activeConfig.targetPatterns || [],
        },
      });
    })
  );

  // New endpoint to manually update status configuration
  router.post(
    "/wardrobe/update-status-config",
    asyncHandler(async (req, res) => {
      console.log("🔄 Manual status configuration update requested");

      const statusConfig = await wardrobeService.updateStatusConfiguration(
        true
      );

      res.json({
        message: "Status configuration updated successfully",
        statusConfig,
        timestamp: new Date().toISOString(),
      });
    })
  );

  router.get(
    "/wardrobe/items-by-status",
    validateRefreshParam,
    validateStatusFilter,
    asyncHandler(async (req, res) => {
      if (req.statusFilter.length === 0) {
        return res.status(400).json({
          error: "No statuses provided",
          message:
            "Please provide at least one status in the 'statuses' query parameter",
        });
      }

      const items = await wardrobeService.getItemsByStatus(
        req.statusFilter,
        req.forceRefresh
      );

      res.json({
        items: items.slice(0, WARDROBE_CONFIG.UI.MAX_FILTER_RESULTS),
        metadata: {
          appliedStatuses: req.statusFilter,
          totalItems: items.length,
          showing: Math.min(
            items.length,
            WARDROBE_CONFIG.UI.MAX_FILTER_RESULTS
          ),
          truncated: items.length > WARDROBE_CONFIG.UI.MAX_FILTER_RESULTS,
        },
      });
    })
  );

  router.get(
    "/wardrobe/active-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const [activeItems, activeConfig] = await Promise.all([
        wardrobeService.getActiveItems(req.forceRefresh),
        Promise.resolve(wardrobeService.getActiveStatusesConfig()),
      ]);

      res.json({
        items: activeItems,
        totalCount: activeItems.length,
        activeStatusesConfig: activeConfig,
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  router.get(
    "/wardrobe/categorized-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const categorizedItems = await wardrobeService.getCategorizedItems(
        req.forceRefresh
      );

      res.json({
        ...categorizedItems,
        summary: {
          active: categorizedItems.active.length,
          inactive: categorizedItems.inactive.length,
          unknown: categorizedItems.unknown.length,
          total:
            categorizedItems.active.length +
            categorizedItems.inactive.length +
            categorizedItems.unknown.length,
        },
      });
    })
  );

  // === DEBUG AND ADMIN ENDPOINTS ===

  router.get(
    "/debug/chat-data",
    asyncHandler(async (req, res) => {
      const debugInfo = await wardrobeService.getDebugData();
      res.json(debugInfo);
    })
  );

  router.post(
    "/refresh/:table",
    asyncHandler(async (req, res) => {
      const { table } = req.params;
      const methodMap = wardrobeService.getMethodMap();

      if (!methodMap[table]) {
        return res.status(400).json({
          error: "Invalid table name",
          validTables: Object.keys(methodMap),
        });
      }

      await wardrobeService[methodMap[table]](true);
      res.json({
        message: `${table} refreshed successfully`,
        timestamp: new Date().toISOString(),
      });
    })
  );

  router.post(
    "/clear-cache",
    asyncHandler(async (req, res) => {
      await wardrobeService.clearAllCache();
      res.json({
        message: "All cache cleared successfully",
        timestamp: new Date().toISOString(),
      });
    })
  );

  // === WARDROBE DATA ENDPOINTS (Legacy Support) ===

  router.get(
    "/wardrobe/items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getItems(req.forceRefresh);
      res.json(items);
    })
  );

  router.get(
    "/wardrobe/inactive-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getInactiveItems(req.forceRefresh);
      res.json(items);
    })
  );

  router.get(
    "/wardrobe/all-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getAllItems(req.forceRefresh);
      res.json(items);
    })
  );

  router.get(
    "/wardrobe/outfits",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const outfits = await wardrobeService.getOutfits(req.forceRefresh);
      res.json(outfits);
    })
  );

  router.get(
    "/wardrobe/usage-log",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const usageLog = await wardrobeService.getUsageLog(req.forceRefresh);
      res.json(usageLog);
    })
  );

  router.get(
    "/wardrobe/inspiration",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const inspiration = await wardrobeService.getInspiration(
        req.forceRefresh
      );
      res.json(inspiration);
    })
  );

  router.get(
    "/wardrobe/shopping-list",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const shoppingList = await wardrobeService.getShoppingList(
        req.forceRefresh
      );
      res.json(shoppingList);
    })
  );

  router.get(
    "/wardrobe/avoids",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const avoids = await wardrobeService.getAvoids(req.forceRefresh);
      res.json(avoids);
    })
  );

  // === ANALYTICS ENDPOINTS ===

  router.get(
    "/wardrobe/analytics",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const analytics = await wardrobeService.analyzeUsagePatterns(
        req.forceRefresh
      );
      res.json({
        ...analytics,
        generatedAt: new Date().toISOString(),
        cacheUsed: !req.forceRefresh,
      });
    })
  );

  router.get(
    "/wardrobe/cost-analysis",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const costAnalysis = await wardrobeService.getCostAnalysis(
        req.forceRefresh
      );
      res.json({
        ...costAnalysis,
        generatedAt: new Date().toISOString(),
        cacheUsed: !req.forceRefresh,
      });
    })
  );

  // === AI CHAT ENDPOINT ===

  router.post(
    "/chat",
    asyncHandler(async (req, res) => {
      const { message, context = [] } = req.body;

      // Validate request
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          error: "Invalid message",
          message: "Message must be a non-empty string",
        });
      }

      if (!Array.isArray(context)) {
        return res.status(400).json({
          error: "Invalid context",
          message: "Context must be an array",
        });
      }

      console.log("💬 === CHAT REQUEST START ===");
      console.log("📝 Message:", message);
      console.log("📋 Context length:", context.length);

      const [analytics, costAnalysis] = await Promise.all([
        wardrobeService.analyzeUsagePatterns(false),
        wardrobeService.getCostAnalysis(false),
      ]);

      console.log("📊 Analytics for AI:", {
        totalActiveItems: analytics?.activeItemsCount,
        totalUsageEntries: analytics?.totalUsageEntries,
        hasSeasonalTrends: !!analytics?.seasonalTrends,
        seasonalTrendsKeys: Object.keys(analytics?.seasonalTrends || {}),
        occasionTrendsKeys: Object.keys(analytics?.occasionTrends || {}),
        activeItemsFormula: analytics?.activeItemsFormula,
      });

      const wardrobeData = {
        detailedAnalytics: analytics,
        costInsights: costAnalysis,
      };

      const response = await aiService.generateResponse(
        message,
        context,
        wardrobeData
      );

      console.log("✅ AI response generated successfully");
      console.log("💬 === CHAT REQUEST END ===");

      res.json({
        response,
        metadata: {
          timestamp: new Date().toISOString(),
          messageLength: message.length,
          contextLength: context.length,
          analyticsIncluded: !!analytics,
          costAnalysisIncluded: !!costAnalysis,
        },
      });
    })
  );

  // === ERROR HANDLING MIDDLEWARE ===

  router.use((error, req, res, next) => {
    console.error("❌ Route error:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.message,
      });
    }

    if (error.message.includes("Airtable")) {
      return res.status(503).json({
        error: "External service unavailable",
        details: "Unable to fetch data from Airtable",
        retryAfter: 30,
      });
    }

    // Generic error response
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || "unknown",
    });
  });

  // 404 handler
  router.use("*", (req, res) => {
    res.status(404).json({
      error: "Endpoint not found",
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        "GET /api/health",
        "GET /api/wardrobe/statuses",
        "GET /api/wardrobe/active-items",
        "GET /api/wardrobe/items-by-status",
        "GET /api/wardrobe/analytics",
        "POST /api/chat",
      ],
    });
  });

  return router;
}

module.exports = createRoutes;
