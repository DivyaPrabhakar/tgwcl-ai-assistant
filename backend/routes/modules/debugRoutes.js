// routes/modules/debugRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const { asyncHandler } = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService) => {
  router.get(
    "/status-page",
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

      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Wardrobe AI - Status Summary</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .demo-banner { background: #3b82f6; color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .metric { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3498db; }
        .code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .count { font-weight: bold; color: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        ${
          DEMO_CONFIG.DEMO_MODE
            ? `
        <div class="demo-banner">
            <h3 style="margin: 0;">🌟 Public Demo Mode</h3>
            <p style="margin: 5px 0 0 0;">This is a live demonstration of the Wardrobe AI system</p>
        </div>
        `
            : ""
        }
        
        <h1>🏷️ Wardrobe AI - Status Summary</h1>
        
        <div class="metric">
            <strong>📊 Total Active Items:</strong> <span class="count">${totalActiveItems}</span>
            <br><span class="timestamp">Last updated: ${new Date(
              statusConfig.lastUpdated
            ).toLocaleString()}</span>
            ${
              DEMO_CONFIG.DEMO_MODE
                ? '<br><span style="color: #3b82f6;">🔒 Demo Mode: Chat functionality disabled</span>'
                : ""
            }
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

        <div class="metric" style="margin-top: 30px;">
            <strong>🔗 API Endpoints:</strong><br>
            <a href="/api/wardrobe/active-status-summary">JSON Summary</a> | 
            <a href="/api/wardrobe/analytics">Analytics</a> |
            <a href="/api/health">Health Check</a>
            ${
              DEMO_CONFIG.DEMO_MODE
                ? '<br><a href="/api/demo/info">Demo Info</a>'
                : ""
            }
        </div>
    </div>
</body>
</html>`;

      res.send(html);
    })
  );

  router.get(
    "/chat-data",
    asyncHandler(async (req, res) => {
      const debugInfo = await wardrobeService.getDebugData();
      debugInfo.demoMode = DEMO_CONFIG.DEMO_MODE;
      debugInfo.demoFeatures = DEMO_CONFIG.DEMO_MODE
        ? DEMO_CONFIG.DEMO_FEATURES
        : null;
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
          demoMode: DEMO_CONFIG.DEMO_MODE,
        });
      }

      await wardrobeService[methodMap[table]](true);
      res.json({
        message: `${table} refreshed successfully`,
        demoMode: DEMO_CONFIG.DEMO_MODE,
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
        demoMode: DEMO_CONFIG.DEMO_MODE,
        timestamp: new Date().toISOString(),
      });
    })
  );

  return router;
};
