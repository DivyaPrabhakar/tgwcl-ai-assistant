// routes/modules/chatRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const { asyncHandler } = require("../middleware/validation");
const router = express.Router();

module.exports = (wardrobeService, aiService) => {
  router.post(
    "/chat",
    asyncHandler(async (req, res) => {
      // Handle demo mode
      if (DEMO_CONFIG.DEMO_MODE) {
        return res.status(403).json({
          error: "Chat disabled in demo mode",
          message:
            "This is a public demonstration. The AI chat feature is disabled for security.",
          demoMode: true,
          isDemo: true,
          sampleResponse:
            "In the full version, I would analyze your wardrobe data and provide personalized insights about your clothing collection, usage patterns, and style recommendations based on your actual purchase history and wearing habits.",
          suggestion:
            "You can view sample conversations at /api/demo/chat-history to see what the AI assistant can do.",
          timestamp: new Date().toISOString(),
        });
      }

      // Normal chat functionality for private deployment
      const { message, context = [] } = req.body;

      // Validate request
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          error: "Invalid message",
          message: "Message must be a non-empty string",
          demoMode: DEMO_CONFIG.DEMO_MODE,
        });
      }

      if (!Array.isArray(context)) {
        return res.status(400).json({
          error: "Invalid context",
          message: "Context must be an array",
          demoMode: DEMO_CONFIG.DEMO_MODE,
        });
      }

      console.log("💬 === CHAT REQUEST START ===");
      console.log("📝 Message:", message);
      console.log("📋 Context length:", context.length);

      const [analytics, costAnalysis] = await Promise.all([
        wardrobeService.analyzeUsagePatterns(false),
        wardrobeService.getCostAnalysis(false),
      ]);

      const wardrobeData = {
        detailedAnalytics: analytics,
        costInsights: costAnalysis,
      };

      const response = await aiService.generateResponse(
        message,
        context,
        wardrobeData
      );

      console.log("💬 === CHAT REQUEST END ===");

      res.json({
        response,
        metadata: {
          timestamp: new Date().toISOString(),
          messageLength: message.length,
          contextLength: context.length,
          analyticsIncluded: !!analytics,
          costAnalysisIncluded: !!costAnalysis,
          demoMode: DEMO_CONFIG.DEMO_MODE,
        },
      });
    })
  );

  return router;
};
