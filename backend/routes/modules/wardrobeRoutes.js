// routes/modules/wardrobeRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const {
  asyncHandler,
  validateRefreshParam,
} = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService) => {
  router.get(
    "/items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getItems(req.forceRefresh);
      res.json({ items, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/inactive-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getInactiveItems(req.forceRefresh);
      res.json({ items, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/all-items",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const items = await wardrobeService.getAllItems(req.forceRefresh);
      res.json({ items, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/outfits",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const outfits = await wardrobeService.getOutfits(req.forceRefresh);
      res.json({ outfits, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/usage-log",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const usageLog = await wardrobeService.getUsageLog(req.forceRefresh);
      res.json({ usageLog, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/inspiration",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const inspiration = await wardrobeService.getInspiration(
        req.forceRefresh
      );
      res.json({ inspiration, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/shopping-list",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const shoppingList = await wardrobeService.getShoppingList(
        req.forceRefresh
      );
      res.json({ shoppingList, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/avoids",
    validateRefreshParam,
    asyncHandler(async (req, res) => {
      const avoids = await wardrobeService.getAvoids(req.forceRefresh);
      res.json({ avoids, demoMode: DEMO_CONFIG.DEMO_MODE });
    })
  );

  router.get(
    "/categorized-items",
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
        demoMode: DEMO_CONFIG.DEMO_MODE,
      });
    })
  );

  return router;
};
