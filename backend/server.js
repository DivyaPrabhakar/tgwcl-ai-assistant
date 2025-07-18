// server.js - Refactored main server file
console.log("🚀 Server startup initiated...");

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Load modules
console.log("🔧 Loading modules...");
const express = require("express");
const cors = require("cors");

// Load configuration and services
const config = require("./config/config");
const WardrobeService = require("./services/wardrobeService");
const AIService = require("./services/aiService");
const createRoutes = require("./routes");

console.log("✅ All modules loaded successfully");

// Validate configuration
config.logStatus();
if (!config.isValid()) {
  console.warn(
    "⚠️ Some environment variables are missing. Running in limited mode."
  );
}

// Initialize Express app
const app = express();
const PORT = config.port;

console.log("✅ Express app created");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local development
      "https://tgwcl-digital-closet.netlify.app", // Your Netlify domain
      "https://thegirlwhocriedlook.com", // If you have a custom domain
    ],
    credentials: true,
  })
);
app.use(express.json());
console.log("✅ Middleware configured");

// Initialize services
const wardrobeService = new WardrobeService();
const aiService = new AIService();
console.log("✅ Services initialized");

// Add this to server.js
app.get("/", (req, res) => {
  res.redirect("/api/health");
});

// Setup routes
const apiRoutes = createRoutes(wardrobeService, aiService);
app.use("/api", apiRoutes);
console.log("✅ Routes configured");

// Initialize and start server
async function startServer() {
  try {
    console.log("🔄 Initializing services...");

    // Initialize wardrobe service (load cached data, etc.)
    const totalCachedRecords = await wardrobeService.initialize();

    console.log(
      `📊 Startup completed with ${totalCachedRecords} cached records`
    );
    console.log("🎯 Ready to serve requests!");

    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Cache status: http://localhost:${PORT}/api/cache-status`);
      console.log(
        `🐛 Debug info: http://localhost:${PORT}/api/debug/chat-data`
      );
      console.log("🎉 Wardrobe AI is ready!");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
