// test-modules.js - Test individual module loading to debug issues
console.log("Testing module loading...");

try {
  console.log("1. Testing config...");
  const config = require("./config/config");
  console.log("✅ Config loaded successfully");
  console.log("Config keys:", Object.keys(config));

  console.log("\n2. Testing CacheManager...");
  const CacheManager = require("./services/cacheManager");
  console.log("✅ CacheManager loaded successfully");
  console.log("CacheManager type:", typeof CacheManager);

  const cacheManager = new CacheManager();
  console.log("✅ CacheManager instance created");

  console.log("\n3. Testing AirtableService...");
  const AirtableService = require("./services/airtableService");
  console.log("✅ AirtableService loaded successfully");
  console.log("AirtableService type:", typeof AirtableService);

  const airtableService = new AirtableService(cacheManager);
  console.log("✅ AirtableService instance created");

  console.log("\n4. Testing AnalyticsService...");
  const AnalyticsService = require("./services/analyticsService");
  console.log("✅ AnalyticsService loaded successfully");
  console.log("AnalyticsService type:", typeof AnalyticsService);

  const analyticsService = new AnalyticsService(airtableService);
  console.log("✅ AnalyticsService instance created");

  console.log("\n5. Testing AIService...");
  const AIService = require("./services/aiService");
  console.log("✅ AIService loaded successfully");
  console.log("AIService type:", typeof AIService);

  const aiService = new AIService();
  console.log("✅ AIService instance created");

  console.log("\n6. Testing WardrobeService...");
  const WardrobeService = require("./services/wardrobeService");
  console.log("✅ WardrobeService loaded successfully");
  console.log("WardrobeService type:", typeof WardrobeService);
  console.log(
    "WardrobeService constructor:",
    WardrobeService.prototype.constructor.name
  );

  const wardrobeService = new WardrobeService();
  console.log("✅ WardrobeService instance created");

  console.log("\n7. Testing routes...");
  const createRoutes = require("./routes");
  console.log("✅ Routes loaded successfully");
  console.log("createRoutes type:", typeof createRoutes);

  console.log("\n🎉 All modules loaded successfully!");
} catch (error) {
  console.error("❌ Module loading failed:", error);
  console.error("Stack trace:", error.stack);
}
