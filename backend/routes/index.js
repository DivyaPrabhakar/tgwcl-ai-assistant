// routes/index.js - Complete routes file with all endpoints
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

// Helper function for status descriptions
function getStatusDescription(status) {
  const descriptions = {
    active: "ready to wear immediately",
    ready_to_sell: "prepared for selling but still owned",
    lent: "temporarily lent to someone else",
    in_laundry: "being washed or dried",
    at_cleaners: "at dry cleaning or professional cleaning",
    needs_repair: "need fixing but still part of your wardrobe",
    borrowed: "temporarily borrowed from someone else",
  };

  return descriptions[status] || "part of your active wardrobe";
}

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

  // Active status summary endpoint
  router.get(
    "/wardrobe/active-status-summary",
    asyncHandler(async (req, res) => {
      // Get current status configuration quietly (no console logs)
      const statusConfig = wardrobeService.getActiveStatusesConfig();

      // Get item counts per status
      const allItems = await wardrobeService.getAllItems(false);
      const statusCounts = {};

      allItems.forEach((item) => {
        const status = item.status;
        if (status) {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });

      // Calculate active item breakdown
      const activeBreakdown = {};
      let totalActiveItems = 0;

      statusConfig.activeStatuses.forEach((status) => {
        const count = statusCounts[status] || 0;
        activeBreakdown[status] = count;
        totalActiveItems += count;
      });

      // Create clean summary
      const summary = {
        totalActiveItems,
        activeStatuses: statusConfig.activeStatuses,
        activeBreakdown,
        targetPatterns: statusConfig.targetPatterns,
        statusMatches: statusConfig.statusMatches || [],
        lastUpdated: statusConfig.lastUpdated,
      };

      res.json(summary);
    })
  );

  // Active status explanation endpoint
  router.get(
    "/wardrobe/active-status-explanation",
    asyncHandler(async (req, res) => {
      const statusConfig = wardrobeService.getActiveStatusesConfig();
      const allItems = await wardrobeService.getAllItems(false);

      // Get breakdown by status
      const statusBreakdown = {};
      let totalActiveItems = 0;

      allItems.forEach((item) => {
        const status = item.status;
        if (statusConfig.activeStatuses.includes(status)) {
          statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
          totalActiveItems++;
        }
      });

      // Get the enhanced formula
      const { STATUS_UTILS } = require("../config/constants");
      const activeFormula = STATUS_UTILS.getActiveFormula(
        statusConfig.activeStatuses,
        statusConfig.statusMatches || []
      );

      const explanation = {
        title: "What Are Active Items?",
        definition:
          "Active items are pieces you currently own and can potentially wear, even if temporarily unavailable.",

        totalActiveItems,

        currentlyFound: statusConfig.activeStatuses.map((status) => ({
          status,
          count: statusBreakdown[status] || 0,
          description: getStatusDescription(status),
        })),

        allConfiguredPatterns: activeFormula.allConfiguredActiveStatuses || [],

        formula: activeFormula.formula,
        explanation: activeFormula.explanation,

        statusMatches: statusConfig.statusMatches || [],

        lastUpdated: statusConfig.lastUpdated,
      };

      res.json(explanation);
    })
  );

  // Manual status configuration update
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

  // === DEBUG ENDPOINTS ===

  // Nice HTML status page
  router.get(
    "/debug/status-page",
    asyncHandler(async (req, res) => {
      const statusConfig = wardrobeService.getActiveStatusesConfig();
      const allItems = await wardrobeService.getAllItems(false);
      const statusCounts = {};

      allItems.forEach((item) => {
        const status = item.status;
        if (status) {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });

      const activeBreakdown = {};
      let totalActiveItems = 0;

      statusConfig.activeStatuses.forEach((status) => {
        const count = statusCounts[status] || 0;
        activeBreakdown[status] = count;
        totalActiveItems += count;
      });

      // Generate HTML
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Wardrobe AI - Active Status Summary</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .metric { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3498db; }
        .active-status { background: #d5edda; border-left-color: #28a745; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .inactive-status { background: #f8d7da; border-left-color: #dc3545; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .match { background: #fff3cd; border-left-color: #ffc107; padding: 8px; margin: 3px 0; border-radius: 4px; font-size: 14px; }
        .code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .timestamp { color: #6c757d; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .count { font-weight: bold; color: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏷️ Wardrobe AI - Active Status Summary</h1>
        
        <div class="metric">
            <strong>📊 Total Active Items:</strong> <span class="count">${totalActiveItems}</span>
            <br><span class="timestamp">Last updated: ${new Date(
              statusConfig.lastUpdated
            ).toLocaleString()}</span>
        </div>

        <h2>✅ Currently Active Statuses</h2>
        <table>
            <thead>
                <tr><th>Status</th><th>Item Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
                ${statusConfig.activeStatuses
                  .map((status) => {
                    const count = activeBreakdown[status] || 0;
                    const percentage =
                      totalActiveItems > 0
                        ? Math.round((count / totalActiveItems) * 100)
                        : 0;
                    return `<tr>
                        <td><span class="code">${status}</span></td>
                        <td class="count">${count}</td>
                        <td>${percentage}%</td>
                    </tr>`;
                  })
                  .join("")}
            </tbody>
        </table>

        <h2>🎯 Target Patterns → Actual Matches</h2>
        ${(statusConfig.statusMatches || [])
          .map(
            (match) =>
              `<div class="match">
                <strong>"${match.actual}"</strong> → matches pattern <strong>"${
                match.target
              }"</strong> 
                (${Math.round(match.score * 100)}% confidence)
            </div>`
          )
          .join("")}

        <h2>📋 All Status Breakdown</h2>
        <table>
            <thead>
                <tr><th>Status</th><th>Count</th><th>Type</th></tr>
            </thead>
            <tbody>
                ${Object.entries(statusCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const isActive =
                      statusConfig.activeStatuses.includes(status);
                    const type = isActive ? "Active" : "Inactive";
                    const rowClass = isActive
                      ? "active-status"
                      : "inactive-status";
                    return `<tr class="${rowClass}">
                            <td><span class="code">${status}</span></td>
                            <td class="count">${count}</td>
                            <td>${type}</td>
                        </tr>`;
                  })
                  .join("")}
            </tbody>
        </table>

        <h2>🔄 Target Patterns</h2>
        <div>
            ${(statusConfig.targetPatterns || [])
              .map(
                (pattern) =>
                  `<span class="code" style="margin: 3px; display: inline-block;">${pattern}</span>`
              )
              .join("")}
        </div>

        <div class="metric" style="margin-top: 30px;">
            <strong>🔗 API Endpoints:</strong><br>
            <a href="/api/wardrobe/active-status-summary">JSON Summary</a> | 
            <a href="/api/wardrobe/statuses">Full Status Config</a> | 
            <a href="/api/wardrobe/active-items">Active Items List</a>
        </div>
    </div>
</body>
</html>`;

      res.send(html);
    })
  );

  // Debug missing statuses
  router.get(
    "/debug/missing-statuses",
    asyncHandler(async (req, res) => {
      const allItems = await wardrobeService.getAllItems(true); // Force fresh

      // Get ALL unique statuses in your Airtable
      const actualStatuses = [
        ...new Set(allItems.map((item) => item.status).filter((s) => s)),
      ].sort();

      // Your target patterns
      const targetPatterns = [
        "active",
        "ready to sell",
        "lent",
        "in laundry",
        "at cleaners",
        "needs repair",
      ];

      // Current matched active statuses
      const statusConfig = wardrobeService.getActiveStatusesConfig();

      const analysis = {
        actualStatusesInYourData: actualStatuses,
        yourTargetPatterns: targetPatterns,
        currentlyMatched: statusConfig.activeStatuses,

        // What's missing
        targetPatternsNotMatched: targetPatterns.filter(
          (target) =>
            !statusConfig.statusMatches?.some(
              (match) => match.target === target
            )
        ),

        // Check if any of your actual statuses might match missing patterns
        potentialMatches: actualStatuses.filter((actual) =>
          targetPatterns.some(
            (target) =>
              actual
                .toLowerCase()
                .replace(/_/g, " ")
                .includes(target.replace(/s$/, "")) ||
              target
                .replace(/s$/, "")
                .includes(actual.toLowerCase().replace(/_/g, " "))
          )
        ),

        statusMatchDetails: statusConfig.statusMatches || [],
      };

      res.json(analysis);
    })
  );

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
        "GET /api/wardrobe/active-status-summary",
        "GET /api/wardrobe/active-status-explanation",
        "GET /api/wardrobe/items-by-status",
        "GET /api/wardrobe/analytics",
        "GET /debug/status-page",
        "POST /api/chat",
      ],
    });
  });

  return router;
}

module.exports = createRoutes;
