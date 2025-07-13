// services/wardrobeService.js - Main wardrobe service that combines all functionality
const path = require("path");
const CacheManager = require("./cacheManager");
const AirtableService = require("./airtableService");
const AnalyticsService = require("./analyticsService");

class WardrobeService {
  constructor() {
    this.cacheManager = new CacheManager();
    this.airtableService = new AirtableService(this.cacheManager);
    this.analyticsService = new AnalyticsService(this.airtableService);

    console.log("✅ WardrobeService initialized with all sub-services");
  }

  // Initialize the service (ensure data directory, load cached data)
  async initialize() {
    await this.cacheManager.ensureDataDir();
    const totalCachedRecords = await this.cacheManager.loadAllCachedData();

    if (totalCachedRecords === 0) {
      console.log(
        "📭 No cached data found. Server is ready - use API endpoints to fetch data when quota allows."
      );
    } else {
      console.log("📚 Using existing cached data. Server ready for chat!");
    }

    return totalCachedRecords;
  }

  // Delegate data fetching methods to AirtableService
  async getItems(forceRefresh = false) {
    return await this.airtableService.getItems(forceRefresh);
  }

  async getInactiveItems(forceRefresh = false) {
    return await this.airtableService.getInactiveItems(forceRefresh);
  }

  async getAllItems(forceRefresh = false) {
    return await this.airtableService.getAllItems(forceRefresh);
  }

  async getOutfits(forceRefresh = false) {
    return await this.airtableService.getOutfits(forceRefresh);
  }

  async getUsageLog(forceRefresh = false) {
    return await this.airtableService.getUsageLog(forceRefresh);
  }

  async getInspiration(forceRefresh = false) {
    return await this.airtableService.getInspiration(forceRefresh);
  }

  async getShoppingList(forceRefresh = false) {
    return await this.airtableService.getShoppingList(forceRefresh);
  }

  async getAvoids(forceRefresh = false) {
    return await this.airtableService.getAvoids(forceRefresh);
  }

  // Delegate analytics methods to AnalyticsService
  async analyzeUsagePatterns(forceRefresh = false) {
    return await this.analyticsService.analyzeUsagePatterns(forceRefresh);
  }

  async getCostAnalysis(forceRefresh = false) {
    return await this.analyticsService.getCostAnalysis(forceRefresh);
  }

  // Cache management methods
  getCacheStatus() {
    return this.cacheManager.getCacheStatus();
  }

  async clearAllCache() {
    return await this.cacheManager.clearAllCache();
  }

  // Method map for refresh endpoints
  getMethodMap() {
    return {
      items: "getItems",
      "inactive-items": "getInactiveItems",
      outfits: "getOutfits",
      "usage-log": "getUsageLog",
      inspiration: "getInspiration",
      "shopping-list": "getShoppingList",
      avoids: "getAvoids",
    };
  }

  // Get comprehensive debug data for troubleshooting
  async getDebugData() {
    try {
      const [
        activeItems,
        inactiveItems,
        outfits,
        usageLog,
        analytics,
        costAnalysis,
      ] = await Promise.all([
        this.getItems(false),
        this.getInactiveItems(false),
        this.getOutfits(false),
        this.getUsageLog(false),
        this.analyzeUsagePatterns(false),
        this.getCostAnalysis(false),
      ]);

      return {
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
        cacheStatus: this.getCacheStatus(),
      };
    } catch (error) {
      console.error("❌ Error generating debug data:", error);
      throw error;
    }
  }
}

module.exports = WardrobeService;
