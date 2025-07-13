// routes/index.js - All API routes
const express = require("express");
const router = express.Router();

function createRoutes(wardrobeService, aiService) {
  // Health check
  router.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Cache status
  router.get("/cache-status", (req, res) => {
    try {
      const status = wardrobeService.getCacheStatus();
      res.json(status);
    } catch (error) {
      console.error("❌ Error getting cache status:", error);
      res.status(500).json({ error: "Failed to get cache status" });
    }
  });

  // Debug endpoint for troubleshooting
  router.get("/debug/chat-data", async (req, res) => {
    try {
      const debugInfo = await wardrobeService.getDebugData();
      res.json(debugInfo);
    } catch (error) {
      console.error("❌ Debug endpoint error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Force refresh specific table
  router.post("/refresh/:table", async (req, res) => {
    try {
      const { table } = req.params;
      const methodMap = wardrobeService.getMethodMap();

      if (!methodMap[table]) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      await wardrobeService[methodMap[table]](true);
      res.json({ message: `${table} refreshed successfully` });
    } catch (error) {
      console.error(`❌ Error refreshing ${req.params.table}:`, error);
      res.status(500).json({ error: `Failed to refresh ${req.params.table}` });
    }
  });

  // Clear all cached data
  router.post("/clear-cache", async (req, res) => {
    try {
      await wardrobeService.clearAllCache();
      res.json({ message: "All cache cleared successfully" });
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  // Wardrobe data endpoints
  router.get("/wardrobe/items", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const items = await wardrobeService.getItems(forceRefresh);
      res.json(items);
    } catch (error) {
      console.error("❌ Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch active items" });
    }
  });

  router.get("/wardrobe/inactive-items", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const items = await wardrobeService.getInactiveItems(forceRefresh);
      res.json(items);
    } catch (error) {
      console.error("❌ Error fetching inactive items:", error);
      res.status(500).json({ error: "Failed to fetch inactive items" });
    }
  });

  router.get("/wardrobe/all-items", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const items = await wardrobeService.getAllItems(forceRefresh);
      res.json(items);
    } catch (error) {
      console.error("❌ Error fetching all items:", error);
      res.status(500).json({ error: "Failed to fetch all items" });
    }
  });

  router.get("/wardrobe/outfits", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const outfits = await wardrobeService.getOutfits(forceRefresh);
      res.json(outfits);
    } catch (error) {
      console.error("❌ Error fetching outfits:", error);
      res.status(500).json({ error: "Failed to fetch outfits" });
    }
  });

  router.get("/wardrobe/usage-log", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const usageLog = await wardrobeService.getUsageLog(forceRefresh);
      res.json(usageLog);
    } catch (error) {
      console.error("❌ Error fetching usage log:", error);
      res.status(500).json({ error: "Failed to fetch usage log" });
    }
  });

  router.get("/wardrobe/inspiration", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const inspiration = await wardrobeService.getInspiration(forceRefresh);
      res.json(inspiration);
    } catch (error) {
      console.error("❌ Error fetching inspiration:", error);
      res.status(500).json({ error: "Failed to fetch inspiration" });
    }
  });

  router.get("/wardrobe/shopping-list", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const shoppingList = await wardrobeService.getShoppingList(forceRefresh);
      res.json(shoppingList);
    } catch (error) {
      console.error("❌ Error fetching shopping list:", error);
      res.status(500).json({ error: "Failed to fetch shopping list" });
    }
  });

  router.get("/wardrobe/avoids", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const avoids = await wardrobeService.getAvoids(forceRefresh);
      res.json(avoids);
    } catch (error) {
      console.error("❌ Error fetching avoids:", error);
      res.status(500).json({ error: "Failed to fetch avoids list" });
    }
  });

  router.get("/wardrobe/analytics", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const analytics = await wardrobeService.analyzeUsagePatterns(
        forceRefresh
      );
      res.json(analytics);
    } catch (error) {
      console.error("❌ Error analyzing patterns:", error);
      res.status(500).json({ error: "Failed to analyze usage patterns" });
    }
  });

  router.get("/wardrobe/cost-analysis", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const costAnalysis = await wardrobeService.getCostAnalysis(forceRefresh);
      res.json(costAnalysis);
    } catch (error) {
      console.error("❌ Error analyzing costs:", error);
      res.status(500).json({ error: "Failed to analyze costs" });
    }
  });

  // Chat endpoint
  router.post("/chat", async (req, res) => {
    try {
      const { message, context = [] } = req.body;
      console.log("💬 === CHAT REQUEST START ===");
      console.log("📝 Message:", message);

      const analytics = await wardrobeService.analyzeUsagePatterns(false);
      const costAnalysis = await wardrobeService.getCostAnalysis(false);

      console.log("📊 Analytics for AI:", {
        totalActiveItems: analytics?.totalActiveItems,
        totalUsageEntries: analytics?.totalUsageEntries,
        hasSeasonalTrends: !!analytics?.seasonalTrends,
        seasonalTrendsKeys: Object.keys(analytics?.seasonalTrends || {}),
        occasionTrendsKeys: Object.keys(analytics?.occasionTrends || {}),
      });

      const wardrobeData = {
        detailedAnalytics: analytics,
        costInsights: costAnalysis,
      };

      console.log("🔗 Sending to AI - wardrobeData structure:", {
        hasDetailedAnalytics: !!wardrobeData.detailedAnalytics,
        hasCostInsights: !!wardrobeData.costInsights,
        totalActiveItems: wardrobeData.detailedAnalytics?.totalActiveItems,
        seasonalTrendsData: wardrobeData.detailedAnalytics?.seasonalTrends,
      });

      const response = await aiService.generateResponse(
        message,
        context,
        wardrobeData
      );
      console.log("✅ AI response length:", response?.length || 0);
      console.log("💬 === CHAT REQUEST END ===");

      res.json({ response });
    } catch (error) {
      console.error("❌ Chat error:", error);
      res.status(500).json({
        error: "Failed to process message",
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createRoutes;
