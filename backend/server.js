// server.js - Refactored main server file

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
const express = require("express");
const cors = require("cors");

// Load configuration and services
const config = require("./config/config");
const WardrobeService = require("./services/wardrobeService");
const AIService = require("./services/aiService");
const createRoutes = require("./routes");


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


// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local development
      "https://tgwcl-digital-closet.netlify.app", // Original Netlify URL
      "https://girlwhocriedlook.com", // Your NEW .com domain ← ADD THIS
      "https://www.girlwhocriedlook.com", // WWW version ← ADD THIS
      "https://thegirlwhocriedlook.style", // Your .style domain ← ADD THIS
      "https://www.thegirlwhocriedlook.style", // WWW .style version ← ADD THIS
      // Allow all netlify deploy previews
      /^https:\/\/.*\.netlify\.app$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize services
const wardrobeService = new WardrobeService();
const aiService = new AIService();

// Add this to server.js
app.get("/", (req, res) => {
  res.redirect("/api/health");
});

// Setup routes
const apiRoutes = createRoutes(wardrobeService, aiService);
app.use("/api", apiRoutes);

// Initialize and start server
async function startServer() {
  try {

    // Initialize wardrobe service (load cached data, etc.)
    const totalCachedRecords = await wardrobeService.initialize();

    console.log(
      `📊 Startup completed with ${totalCachedRecords} cached records`
    );
    console.log("🎯 Ready to serve requests!");

    // Start the server
    app.listen(PORT, () => {
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
