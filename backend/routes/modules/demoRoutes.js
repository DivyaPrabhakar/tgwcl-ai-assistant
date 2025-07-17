// routes/modules/demoRoutes.js
const express = require("express");
const DEMO_CONFIG = require("../../config/demoConfig");
const router = express.Router();

router.get("/info", (req, res) => {
  res.json({
    demoMode: DEMO_CONFIG.DEMO_MODE,
    features: DEMO_CONFIG.DEMO_FEATURES,
    user: DEMO_CONFIG.DEMO_USER,
    message: DEMO_CONFIG.DEMO_MODE
      ? "This is a public demonstration. Chat functionality is disabled."
      : "Full functionality available.",
    timestamp: new Date().toISOString(),
  });
});

router.get("/chat-history", (req, res) => {
  if (!DEMO_CONFIG.DEMO_MODE) {
    return res.status(403).json({ error: "Demo mode not enabled" });
  }

  res.json({
    messages: DEMO_CONFIG.SAMPLE_CHAT_HISTORY,
    isDemo: true,
    note: "These are sample conversations to demonstrate the AI assistant capabilities.",
    timestamp: new Date().toISOString(),
  });
});

module.exports = () => router;
