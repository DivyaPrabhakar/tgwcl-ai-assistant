// server.js - Complete working version with debug logging
console.log("🚀 Server startup initiated...");

// Add error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

console.log("🔧 Loading modules...");

const express = require("express");
const cors = require("cors");
const Airtable = require("airtable");
const OpenAI = require("openai");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

console.log("✅ All modules loaded successfully");

// Check environment variables
console.log("📋 Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("- PORT:", process.env.PORT || "not set (will use 3001)");
console.log(
  "- AIRTABLE_API_KEY:",
  process.env.AIRTABLE_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "- OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing"
);

const app = express();
const PORT = process.env.PORT || 3001;

console.log("✅ Express app created");

// Middleware
app.use(cors());
app.use(express.json());

console.log("✅ Middleware configured");

// Data persistence configuration
const DATA_DIR = path.join(__dirname, "cached_data");
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

console.log("✅ Constants defined");

// In-memory cache
const cache = {
  items: { data: null, timestamp: null, lastRecordId: null },
  inactiveItems: { data: null, timestamp: null, lastRecordId: null },
  outfits: { data: null, timestamp: null, lastRecordId: null },
  usageLog: { data: null, timestamp: null, lastRecordId: null },
  inspiration: { data: null, timestamp: null, lastRecordId: null },
  shoppingList: { data: null, timestamp: null, lastRecordId: null },
  avoids: { data: null, timestamp: null, lastRecordId: null },
};

console.log("✅ Cache object created");

// Utility functions
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

async function loadFromFile(key) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data);
    console.log(`Loaded ${parsed.data?.length || 0} ${key} records from file`);
    return parsed;
  } catch (error) {
    console.log(`No cached file found for ${key}, starting fresh`);
    return { data: [], timestamp: null, lastRecordId: null };
  }
}

async function saveToFile(key, cacheEntry) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
    console.log(`Saved ${cacheEntry.data?.length || 0} ${key} records to file`);
  } catch (error) {
    console.error(`Error saving ${key} to file:`, error);
  }
}

function isCacheValid(cacheEntry) {
  if (!cacheEntry.data || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_EXPIRY;
}

async function updateCache(key, data, lastRecordId = null) {
  cache[key] = {
    data: data,
    timestamp: Date.now(),
    lastRecordId: lastRecordId,
    fetching: false,
  };
  await saveToFile(key, cache[key]);
  console.log(`Cache updated for ${key}: ${data.length} records`);
}

async function loadAllCachedData() {
  console.log("Loading cached data from files...");
  for (const key of Object.keys(cache)) {
    cache[key] = await loadFromFile(key);
  }
}

console.log("✅ Utility functions defined");

// Initialize Airtable bases
let airtable, closetBase, referencesBase, finishedBase;
if (process.env.AIRTABLE_API_KEY) {
  airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  });
  closetBase = airtable.base(process.env.AIRTABLE_CLOSET_BASE_ID);
  referencesBase = airtable.base(process.env.AIRTABLE_REFERENCES_BASE_ID);
  finishedBase = airtable.base(process.env.AIRTABLE_FINISHED_BASE_ID);
}

console.log("✅ Airtable configured");

// Initialize OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

console.log("✅ OpenAI configured");

// Wardrobe Service
class WardrobeService {
  async fetchIncrementally(
    base,
    tableName,
    cacheKey,
    view = null,
    sortField = null
  ) {
    if (!base) {
      console.log(`No base available for ${tableName}, returning cached data`);
      return cache[cacheKey].data || [];
    }

    if (cache[cacheKey].fetching) {
      console.log(`Already fetching ${tableName}, returning cached data`);
      return cache[cacheKey].data || [];
    }

    cache[cacheKey].fetching = true;

    try {
      const existingData = cache[cacheKey].data || [];
      const lastRecordId = cache[cacheKey].lastRecordId;

      console.log(
        `Fetching ${tableName} incrementally... (${existingData.length} existing records)`
      );

      const selectOptions = {};
      if (view) selectOptions.view = view;
      if (sortField)
        selectOptions.sort = [{ field: sortField, direction: "desc" }];

      let allRecords = [];
      let pageCount = 0;
      const maxPages = 50;

      await base(tableName)
        .select(selectOptions)
        .eachPage((pageRecords, fetchNextPage) => {
          pageCount++;
          console.log(
            `Processing page ${pageCount} with ${pageRecords.length} records for ${tableName}`
          );

          if (!lastRecordId) {
            for (const record of pageRecords) {
              allRecords.push({
                id: record.id,
                status: cacheKey.includes("inactive") ? "inactive" : "active",
                ...record.fields,
              });
            }
            if (pageCount < maxPages) fetchNextPage();
          } else {
            let foundLastRecord = false;
            for (const record of pageRecords) {
              if (record.id === lastRecordId) {
                foundLastRecord = true;
                break;
              }
              allRecords.push({
                id: record.id,
                status: cacheKey.includes("inactive") ? "inactive" : "active",
                ...record.fields,
              });
            }
            if (!foundLastRecord && pageCount < maxPages) fetchNextPage();
          }
        });

      const finalRecords = lastRecordId
        ? [...allRecords, ...existingData]
        : allRecords;
      const newLastRecordId =
        finalRecords.length > 0 ? finalRecords[0].id : lastRecordId;

      await updateCache(cacheKey, finalRecords, newLastRecordId);
      return finalRecords;
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error.message);
      return cache[cacheKey].data || [];
    } finally {
      cache[cacheKey].fetching = false;
    }
  }

  async getItems(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.items) &&
      cache.items.data?.length > 0
    ) {
      console.log("Returning cached items");
      return cache.items.data;
    }
    return await this.fetchIncrementally(
      closetBase,
      "Items",
      "items",
      "All items"
    );
  }

  async getInactiveItems(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.inactiveItems) &&
      cache.inactiveItems.data?.length > 0
    ) {
      console.log("Returning cached inactive items");
      return cache.inactiveItems.data;
    }
    return await this.fetchIncrementally(
      finishedBase,
      "Inactive items",
      "inactiveItems"
    );
  }

  async getAllItems(forceRefresh = false) {
    const [active, inactive] = await Promise.all([
      this.getItems(forceRefresh),
      this.getInactiveItems(forceRefresh),
    ]);
    return [...active, ...inactive];
  }

  async getOutfits(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.outfits) &&
      cache.outfits.data?.length > 0
    ) {
      console.log("Returning cached outfits");
      return cache.outfits.data;
    }
    return await this.fetchIncrementally(
      closetBase,
      "Outfits",
      "outfits",
      "Evaluation view",
      "id"
    );
  }

  async getUsageLog(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.usageLog) &&
      cache.usageLog.data?.length > 0
    ) {
      console.log("Returning cached usage log");
      return cache.usageLog.data;
    }

    const possibleConfigs = [
      { table: "Usage Log", view: "Detailed view", sort: "date_worn" },
      { table: "Usage Log", view: "Grid view", sort: "date_worn" },
      { table: "Usage Log", sort: "date_worn" },
      { table: "Usage Log" },
    ];

    for (const config of possibleConfigs) {
      try {
        return await this.fetchIncrementally(
          closetBase,
          config.table,
          "usageLog",
          config.view,
          config.sort
        );
      } catch (error) {
        console.log(`Config failed: ${error.message}`);
        continue;
      }
    }
    return [];
  }

  async getInspiration(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.inspiration) &&
      cache.inspiration.data?.length > 0
    ) {
      return cache.inspiration.data;
    }
    return await this.fetchIncrementally(
      referencesBase,
      "Inspiration",
      "inspiration"
    );
  }

  async getShoppingList(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.shoppingList) &&
      cache.shoppingList.data?.length > 0
    ) {
      return cache.shoppingList.data;
    }
    return await this.fetchIncrementally(
      referencesBase,
      "Shopping list",
      "shoppingList"
    );
  }

  async getAvoids(forceRefresh = false) {
    if (
      !forceRefresh &&
      isCacheValid(cache.avoids) &&
      cache.avoids.data?.length > 0
    ) {
      return cache.avoids.data;
    }
    return await this.fetchIncrementally(referencesBase, "Avoids", "avoids");
  }

  getSeason(month) {
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  }

  analyzeDepartments(items) {
    const departments = {};
    items.forEach((item) => {
      if (item.department) {
        departments[item.department] = (departments[item.department] || 0) + 1;
      }
    });
    return departments;
  }

  analyzePrices(items) {
    const prices = items
      .filter((item) => item.purchase_price && item.purchase_price > 0)
      .map((item) => item.purchase_price);

    if (prices.length === 0) return { average: 0, total: 0, count: 0 };

    const total = prices.reduce((sum, price) => sum + price, 0);
    const average = total / prices.length;
    const sorted = prices.sort((a, b) => a - b);

    return {
      total,
      average,
      median: sorted[Math.floor(sorted.length / 2)],
      count: prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  analyzeUtilization(items) {
    const utilizationStats = {};
    items.forEach((item) => {
      if (item.item_utilization) {
        const util = item.item_utilization;
        utilizationStats[util] = (utilizationStats[util] || 0) + 1;
      }
    });
    return utilizationStats;
  }

  analyzeInactiveItems(inactiveItems) {
    const reasons = {};
    const categories = {};

    inactiveItems.forEach((item) => {
      if (item["Reason"]) {
        reasons[item["Reason"]] = (reasons[item["Reason"]] || 0) + 1;
      }
      if (item["Category"]) {
        categories[item["Category"]] = (categories[item["Category"]] || 0) + 1;
      }
    });

    return { reasons, categories };
  }

  async analyzeUsagePatterns(forceRefresh = false) {
    console.log("=== ANALYZE USAGE PATTERNS START ===");

    const [activeItems, inactiveItems, outfits, usageLog] = await Promise.all([
      this.getItems(forceRefresh),
      this.getInactiveItems(forceRefresh),
      this.getOutfits(forceRefresh),
      this.getUsageLog(forceRefresh),
    ]);

    console.log("Analytics raw data counts:", {
      activeItems: activeItems?.length || 0,
      inactiveItems: inactiveItems?.length || 0,
      outfits: outfits?.length || 0,
      usageLog: usageLog?.length || 0,
    });

    if (activeItems?.length > 0) {
      console.log("Sample active item:", {
        id: activeItems[0].id,
        item_name: activeItems[0].item_name,
        department: activeItems[0].department,
        purchase_price: activeItems[0].purchase_price,
      });
    }
    if (usageLog?.length > 0) {
      console.log("Sample usage log entry:", {
        id: usageLog[0].id,
        date_worn: usageLog[0].date_worn,
        occasion: usageLog[0].occasion,
        outfit_id: usageLog[0].outfit_id,
      });
    }

    const itemUsage = {};
    const seasonalTrends = {};
    const occasionTrends = {};

    const itemIdToName = {};
    activeItems.forEach((item) => {
      if (item.id && item.item_name) {
        itemIdToName[item.id] = item.item_name;
      }
    });

    console.log(
      `Created item lookup map with ${Object.keys(itemIdToName).length} items`
    );

    let processedEntries = 0;
    let seasonalEntries = 0;
    let occasionEntries = 0;

    usageLog.forEach((record, index) => {
      if (record.outfit_id) {
        const key = `outfit_${record.outfit_id}`;
        itemUsage[key] = (itemUsage[key] || 0) + 1;
        processedEntries++;
      }

      if (record.date_worn) {
        try {
          const date = new Date(record.date_worn);
          if (!isNaN(date.getTime())) {
            const month = date.getMonth();
            const season = this.getSeason(month);
            seasonalTrends[season] = (seasonalTrends[season] || 0) + 1;
            seasonalEntries++;
          }
        } catch (e) {
          console.log(`Error parsing date: ${record.date_worn}`);
        }
      }

      if (record.occasion) {
        occasionTrends[record.occasion] =
          (occasionTrends[record.occasion] || 0) + 1;
        occasionEntries++;
      }

      if (index < 3) {
        console.log(`Usage entry ${index}:`, {
          date_worn: record.date_worn,
          occasion: record.occasion,
          outfit_id: record.outfit_id,
          temp_rating: record.temp_rating,
        });
      }
    });

    console.log("Processing complete:", {
      processedEntries,
      seasonalEntries,
      occasionEntries,
      seasonalTrendsCount: Object.keys(seasonalTrends).length,
      occasionTrendsCount: Object.keys(occasionTrends).length,
    });

    const mostWornOutfits = Object.entries(itemUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([outfitKey, count]) => ({
        item: outfitKey,
        usage: count,
      }));

    const leastWornOutfits = Object.entries(itemUsage)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 10)
      .map(([outfitKey, count]) => ({
        item: outfitKey,
        usage: count,
      }));

    const result = {
      totalActiveItems: activeItems.length,
      totalInactiveItems: inactiveItems.length,
      totalOutfits: outfits.length,
      totalUsageEntries: usageLog.length,
      mostWornItems: mostWornOutfits,
      leastWornItems: leastWornOutfits,
      seasonalTrends,
      occasionTrends,
      inactiveItemsAnalysis: this.analyzeInactiveItems(inactiveItems),
      departmentBreakdown: this.analyzeDepartments(activeItems),
      priceAnalysis: this.analyzePrices(activeItems),
      utilizationStats: this.analyzeUtilization(activeItems),
    };

    console.log("Final analytics result:", {
      totalActiveItems: result.totalActiveItems,
      totalUsageEntries: result.totalUsageEntries,
      seasonalTrendsKeys: Object.keys(result.seasonalTrends),
      occasionTrendsKeys: Object.keys(result.occasionTrends),
      seasonalTrendsData: result.seasonalTrends,
    });

    return result;
  }

  async getCostAnalysis(forceRefresh = false) {
    const [activeItems, inactiveItems, usageLog] = await Promise.all([
      this.getItems(forceRefresh),
      this.getInactiveItems(forceRefresh),
      this.getUsageLog(forceRefresh),
    ]);

    const allItems = [...activeItems, ...inactiveItems];

    const costPerWear = allItems
      .map((item) => {
        const itemName = item.item_name || item.name;
        const wearCount = usageLog.filter((u) => {
          const logItem = Array.isArray(u["Item"]) ? u["Item"][0] : u["Item"];
          return logItem === itemName || logItem === item.id;
        }).length;

        const cost = item.purchase_price || item.cost || 0;
        return {
          name: itemName,
          cost,
          wearCount,
          costPerWear: wearCount > 0 ? cost / wearCount : cost,
          status: item.status,
        };
      })
      .sort((a, b) => a.costPerWear - b.costPerWear);

    return {
      totalInvestment: allItems.reduce(
        (sum, item) => sum + (item.purchase_price || item.cost || 0),
        0
      ),
      activeWardrobeValue: activeItems.reduce(
        (sum, item) => sum + (item.purchase_price || item.cost || 0),
        0
      ),
      bestValueItems: costPerWear
        .filter((item) => item.wearCount > 0)
        .slice(0, 10),
      worstValueItems: costPerWear
        .filter((item) => item.wearCount > 0)
        .slice(-10),
      unwornItems: costPerWear.filter(
        (item) => item.wearCount === 0 && item.status === "active"
      ),
    };
  }
}

console.log("✅ WardrobeService class defined");

const wardrobeService = new WardrobeService();

console.log("✅ WardrobeService instance created");

// AI Service
class AIService {
  async generateResponse(message, context, wardrobeData) {
    if (!openai) {
      return "I'm sorry, but the AI service is not configured. Please set up your OpenAI API key to enable AI responses.";
    }

    const systemPrompt = `You are a personal wardrobe AI assistant with access to detailed wardrobe data. You must provide SPECIFIC, DATA-DRIVEN responses using the exact information provided.

CURRENT WARDROBE DATA:
- Active Items: ${wardrobeData.detailedAnalytics?.totalActiveItems || 0} items
- Total Outfits: ${
      wardrobeData.detailedAnalytics?.totalOutfits || 0
    } outfits logged
- Usage Entries: ${
      wardrobeData.detailedAnalytics?.totalUsageEntries || 0
    } individual wears tracked
- Total Investment: $${wardrobeData.costInsights?.totalInvestment || 0}

SPECIFIC SEASONAL DATA:
${JSON.stringify(wardrobeData.detailedAnalytics?.seasonalTrends || {}, null, 2)}

OCCASION TRENDS:
${JSON.stringify(wardrobeData.detailedAnalytics?.occasionTrends || {}, null, 2)}

DEPARTMENT BREAKDOWN:
${JSON.stringify(
  wardrobeData.detailedAnalytics?.departmentBreakdown || {},
  null,
  2
)}

PRICE ANALYSIS:
Average item cost: $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.average?.toFixed(2) || 0
    }
Total wardrobe investment: $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.total || 0
    }
Price range: $${wardrobeData.detailedAnalytics?.priceAnalysis?.min || 0} - $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.max || 0
    }

MOST WORN OUTFITS:
${
  wardrobeData.detailedAnalytics?.mostWornItems
    ?.map((item) => `- ${item.item}: ${item.usage} times`)
    .join("\n") || "No usage data available"
}

CRITICAL INSTRUCTIONS:
1. ALWAYS use specific numbers from the data provided above
2. ALWAYS reference actual seasonal trends, occasion patterns, and department breakdowns
3. ALWAYS cite specific wear counts, costs, and statistics
4. NEVER give generic advice - only use the actual data provided
5. Always start responses with "Based on your wardrobe data..." and cite specific numbers

Be conversational but ALWAYS data-specific. Never give generic wardrobe advice.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...context.map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 800,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      if (error.code === "insufficient_quota") {
        return "I'm currently experiencing quota limitations with the AI service. I can still access your wardrobe data, but AI responses are temporarily limited.";
      }
      throw error;
    }
  }
}

console.log("✅ AIService class defined");

const aiService = new AIService();

console.log("✅ AIService instance created");

// Initialize app
async function initializeApp() {
  await ensureDataDir();
  await loadAllCachedData();

  const totalCachedRecords = Object.values(cache).reduce((sum, cacheEntry) => {
    return sum + (cacheEntry.data ? cacheEntry.data.length : 0);
  }, 0);

  console.log(`Total cached records: ${totalCachedRecords}`);
  console.log("Startup completed. Ready to serve requests.");
}

console.log("🔄 About to define routes...");

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/cache-status", (req, res) => {
  const status = {};
  Object.keys(cache).forEach((key) => {
    status[key] = {
      hasData: !!cache[key].data,
      recordCount: cache[key].data ? cache[key].data.length : 0,
      lastUpdated: cache[key].timestamp
        ? new Date(cache[key].timestamp).toISOString()
        : null,
      isValid: isCacheValid(cache[key]),
      lastRecordId: cache[key].lastRecordId,
    };
  });
  res.json(status);
});

app.get("/api/debug/chat-data", async (req, res) => {
  try {
    const [
      activeItems,
      inactiveItems,
      outfits,
      usageLog,
      analytics,
      costAnalysis,
    ] = await Promise.all([
      wardrobeService.getItems(false),
      wardrobeService.getInactiveItems(false),
      wardrobeService.getOutfits(false),
      wardrobeService.getUsageLog(false),
      wardrobeService.analyzeUsagePatterns(false),
      wardrobeService.getCostAnalysis(false),
    ]);

    const debugInfo = {
      rawDataCounts: {
        activeItems: activeItems?.length || 0,
        inactiveItems: inactiveItems?.length || 0,
        outfits: outfits?.length || 0,
        usageLog: usageLog?.length || 0,
      },
      sampleData: {
        firstActiveItem: activeItems?.[0] || null,
        firstUsageEntry: usageLog?.[0] || null,
      },
      analyticsStructure: {
        hasAnalytics: !!analytics,
        analyticsKeys: analytics ? Object.keys(analytics) : [],
        totalActiveItems: analytics?.totalActiveItems,
        totalUsageEntries: analytics?.totalUsageEntries,
        seasonalTrends: analytics?.seasonalTrends,
        occasionTrends: analytics?.occasionTrends,
        departmentBreakdown: analytics?.departmentBreakdown,
      },
      costAnalysisStructure: {
        hasCostAnalysis: !!costAnalysis,
        costAnalysisKeys: costAnalysis ? Object.keys(costAnalysis) : [],
        totalInvestment: costAnalysis?.totalInvestment,
      },
    };

    res.json(debugInfo);
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/refresh/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const methodMap = {
      items: "getItems",
      "inactive-items": "getInactiveItems",
      outfits: "getOutfits",
      "usage-log": "getUsageLog",
      inspiration: "getInspiration",
      "shopping-list": "getShoppingList",
      avoids: "getAvoids",
    };

    if (!methodMap[table]) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    await wardrobeService[methodMap[table]](true);
    res.json({ message: `${table} refreshed successfully` });
  } catch (error) {
    console.error(`Error refreshing ${req.params.table}:`, error);
    res.status(500).json({ error: `Failed to refresh ${req.params.table}` });
  }
});

app.post("/api/clear-cache", async (req, res) => {
  try {
    Object.keys(cache).forEach((key) => {
      cache[key] = { data: null, timestamp: null, lastRecordId: null };
    });

    for (const key of Object.keys(cache)) {
      try {
        await fs.unlink(path.join(DATA_DIR, `${key}.json`));
      } catch (error) {
        // File might not exist
      }
    }

    res.json({ message: "All cache cleared successfully" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

app.get("/api/wardrobe/items", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const items = await wardrobeService.getItems(forceRefresh);
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch active items" });
  }
});

app.get("/api/wardrobe/usage-log", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const usageLog = await wardrobeService.getUsageLog(forceRefresh);
    res.json(usageLog);
  } catch (error) {
    console.error("Error fetching usage log:", error);
    res.status(500).json({ error: "Failed to fetch usage log" });
  }
});

app.get("/api/wardrobe/analytics", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const analytics = await wardrobeService.analyzeUsagePatterns(forceRefresh);
    res.json(analytics);
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    res.status(500).json({ error: "Failed to analyze usage patterns" });
  }
});

app.get("/api/wardrobe/cost-analysis", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const costAnalysis = await wardrobeService.getCostAnalysis(forceRefresh);
    res.json(costAnalysis);
  } catch (error) {
    console.error("Error analyzing costs:", error);
    res.status(500).json({ error: "Failed to analyze costs" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    console.log("=== CHAT REQUEST START ===");
    console.log("Message:", message);

    const analytics = await wardrobeService.analyzeUsagePatterns(false);
    const costAnalysis = await wardrobeService.getCostAnalysis(false);

    console.log("Analytics for AI:", {
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

    console.log("Sending to AI - wardrobeData structure:", {
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
    console.log("AI response length:", response?.length || 0);
    console.log("=== CHAT REQUEST END ===");

    res.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    res
      .status(500)
      .json({ error: "Failed to process message", details: error.message });
  }
});

console.log("✅ All routes defined");

// Initialize and start server
initializeApp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log("🎉 Wardrobe AI is ready!");
    });
  })
  .catch((error) => {
    console.error("❌ Failed to initialize app:", error);
    process.exit(1);
  });

module.exports = app;
