// routes/modules/statusRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const { WARDROBE_CONFIG } = require("../../config/constants");
const {
  asyncHandler,
  validateRefreshParam,
  validateStatusFilter,
} = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService) => {
  router.get(
    "/statuses",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
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
        demoMode: DEMO_CONFIG.DEMO_MODE,
        dynamicMatching: {
          matches: activeConfig.statusMatches || [],
          unmatchedStatuses: activeConfig.unmatchedStatuses || [],
          targetPatterns: activeConfig.targetPatterns || [],
        },
      });
    })
  );

  router.get(
    "/active-status-summary",
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

      const summary = {
        totalActiveItems,
        activeStatuses: statusConfig.activeStatuses,
        activeBreakdown,
        targetPatterns: statusConfig.targetPatterns,
        statusMatches: statusConfig.statusMatches || [],
        lastUpdated: statusConfig.lastUpdated,
        demoMode: DEMO_CONFIG.DEMO_MODE,
      };

      res.json(summary);
    })
  );

  router.get(
    "/items-by-status",
    validateRefreshParam,
    validateStatusFilter,
    asyncHandler(async (req, res) => {
      if (req.statusFilter.length === 0) {
        return res.status(400).json({
          error: "No statuses provided",
          message:
            "Please provide at least one status in the 'statuses' query parameter",
          demoMode: DEMO_CONFIG.DEMO_MODE,
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
          demoMode: DEMO_CONFIG.DEMO_MODE,
        },
      });
    })
  );

  router.get(
    "/active-items",
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
        demoMode: DEMO_CONFIG.DEMO_MODE,
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  return router;
};
