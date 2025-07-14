// services/wardrobeService.js - Complete refactored version with dynamic status detection
const CacheManager = require("./cacheManager");
const AirtableService = require("./airtableService");
const AnalyticsService = require("./analyticsService");
const {
  WARDROBE_CONFIG,
  FIELD_EXTRACTORS,
  STATUS_MATCHER,
  STATUS_UTILS,
} = require("../config/constants");

class WardrobeService {
  constructor() {
    this.cacheManager = new CacheManager();
    this.airtableService = new AirtableService(this.cacheManager);
    this.analyticsService = new AnalyticsService(this.airtableService);

    // Dynamic status configuration - determined from Airtable data
    this.statusConfig = {
      allStatuses: [],
      activeStatuses: [],
      statusMatches: [],
      unmatchedStatuses: [],
      lastUpdated: null,
    };

    console.log("✅ WardrobeService initialized with dynamic status detection");
  }

  // === INITIALIZATION ===

  async initialize() {
    await this.cacheManager.ensureDataDir();
    const totalCachedRecords = await this.cacheManager.loadAllCachedData();

    // Initialize status configuration from cached data
    await this.updateStatusConfiguration(false);

    if (totalCachedRecords === 0) {
      console.log(
        "📭 No cached data found. Server is ready - use API endpoints to fetch data when quota allows."
      );
    } else {
      console.log("📚 Using existing cached data. Server ready for chat!");
      console.log(
        `🏷️ Detected ${this.statusConfig.allStatuses.length} unique statuses`
      );
      console.log(
        `✅ Identified ${this.statusConfig.activeStatuses.length} as active statuses`
      );
    }

    return totalCachedRecords;
  }

  // === DYNAMIC STATUS DETECTION ===

  async updateStatusConfiguration(forceRefresh = false) {
    try {
      console.log("🔄 Updating status configuration from Airtable data...");

      const allItems = await this.getAllItems(forceRefresh);

      // Extract all unique statuses from actual data
      const allStatuses = [
        ...new Set(
          allItems
            .map((item) => FIELD_EXTRACTORS.extractStatus(item))
            .filter((status) => status && status !== "unknown")
        ),
      ].sort();

      console.log(
        `📊 Found ${allStatuses.length} unique statuses in Airtable:`,
        allStatuses
      );

      // Use fuzzy matching to determine which statuses are "active"
      const matchingResult =
        STATUS_MATCHER.determineActiveStatuses(allStatuses);

      // Update configuration
      this.statusConfig = {
        allStatuses,
        activeStatuses: matchingResult.activeStatuses,
        statusMatches: matchingResult.matches,
        unmatchedStatuses: matchingResult.unmatchedStatuses,
        lastUpdated: new Date().toISOString(),
      };

      console.log("✅ Status configuration updated:");
      console.log(
        `   - Total statuses: ${this.statusConfig.allStatuses.length}`
      );
      console.log(
        `   - Active statuses: ${this.statusConfig.activeStatuses.length}`
      );
      console.log(
        `   - Matched patterns: ${this.statusConfig.statusMatches.length}`
      );
      console.log(
        `   - Unmatched: ${this.statusConfig.unmatchedStatuses.length}`
      );

      return this.statusConfig;
    } catch (error) {
      console.error("❌ Error updating status configuration:", error);

      // Fallback to target statuses if we can't determine from data
      this.statusConfig = {
        allStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
        activeStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
        statusMatches: [],
        unmatchedStatuses: [],
        lastUpdated: new Date().toISOString(),
        error: error.message,
      };

      return this.statusConfig;
    }
  }

  async getAllItemStatuses(forceRefresh = false) {
    if (forceRefresh || this.statusConfig.allStatuses.length === 0) {
      await this.updateStatusConfiguration(forceRefresh);
    }

    return this.statusConfig.allStatuses;
  }

  getActiveStatuses() {
    return this.statusConfig.activeStatuses;
  }

  // === STATUS-BASED FILTERING METHODS ===

  async getItemsByStatus(statuses = [], forceRefresh = false) {
    if (!Array.isArray(statuses)) {
      throw new Error("Statuses must be an array");
    }

    const allItems = await this.getAllItems(forceRefresh);

    if (statuses.length === 0) {
      return allItems;
    }

    return allItems.filter((item) => {
      const itemStatus = FIELD_EXTRACTORS.extractStatus(item);
      return statuses.includes(itemStatus);
    });
  }

  async getActiveItems(forceRefresh = false) {
    // Ensure we have current status configuration
    if (forceRefresh || this.statusConfig.activeStatuses.length === 0) {
      await this.updateStatusConfiguration(forceRefresh);
    }

    return await this.getItemsByStatus(
      this.statusConfig.activeStatuses,
      forceRefresh
    );
  }

  async getInactiveItemsByStatus(forceRefresh = false) {
    const allItems = await this.getAllItems(forceRefresh);
    const activeStatuses = this.getActiveStatuses();

    return allItems.filter((item) => {
      const itemStatus = FIELD_EXTRACTORS.extractStatus(item);
      return !activeStatuses.includes(itemStatus);
    });
  }

  async getCategorizedItems(forceRefresh = false) {
    const allItems = await this.getAllItems(forceRefresh);
    const activeStatuses = this.getActiveStatuses();

    return STATUS_UTILS.categorizeByStatus(allItems, activeStatuses);
  }

  // === BASIC DATA FETCHING METHODS ===

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

  // === ANALYTICS METHODS ===

  async analyzeUsagePatterns(forceRefresh = false) {
    // Ensure status configuration is current
    if (forceRefresh || this.statusConfig.activeStatuses.length === 0) {
      await this.updateStatusConfiguration(forceRefresh);
    }

    const analytics = await this.analyticsService.analyzeUsagePatterns(
      forceRefresh,
      this.statusConfig
    );

    // Add dynamic status information
    const allItems = await this.getAllItems(forceRefresh);
    const statusBreakdown = this._calculateStatusBreakdown(allItems);
    const categorizedItems = STATUS_UTILS.categorizeByStatus(
      allItems,
      this.statusConfig.activeStatuses
    );

    return {
      ...analytics,
      statusBreakdown,
      activeItemsCount: categorizedItems.active.length,
      inactiveItemsCount: categorizedItems.inactive.length,
      statusConfig: this.statusConfig,
      activeItemsFormula: STATUS_UTILS.getActiveFormula(
        this.statusConfig.activeStatuses,
        this.statusConfig.statusMatches
      ),
    };
  }

  async getCostAnalysis(forceRefresh = false) {
    return await this.analyticsService.getCostAnalysis(
      forceRefresh,
      this.statusConfig
    );
  }

  // === CONFIGURATION METHODS ===

  getActiveStatusesConfig() {
    return {
      activeStatuses: this.statusConfig.activeStatuses,
      allStatuses: this.statusConfig.allStatuses,
      statusMatches: this.statusConfig.statusMatches,
      unmatchedStatuses: this.statusConfig.unmatchedStatuses,
      targetPatterns: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      description:
        "Statuses dynamically determined from Airtable data using fuzzy matching",
      formula: STATUS_UTILS.getActiveFormula(
        this.statusConfig.activeStatuses,
        this.statusConfig.statusMatches
      ),
      lastUpdated: this.statusConfig.lastUpdated,
    };
  }

  getWardrobeConfig() {
    return {
      targetActiveStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      currentStatusConfig: this.statusConfig,
      fieldMappings: WARDROBE_CONFIG.FIELD_MAPPINGS,
      uiConfig: WARDROBE_CONFIG.UI,
      analyticsConfig: WARDROBE_CONFIG.ANALYTICS,
    };
  }

  // === CACHE MANAGEMENT ===

  getCacheStatus() {
    const cacheStatus = this.cacheManager.getCacheStatus();
    return {
      ...cacheStatus,
      statusConfig: {
        configured: this.statusConfig.activeStatuses.length > 0,
        totalStatuses: this.statusConfig.allStatuses.length,
        activeStatuses: this.statusConfig.activeStatuses.length,
        lastUpdated: this.statusConfig.lastUpdated,
      },
    };
  }

  async clearAllCache() {
    await this.cacheManager.clearAllCache();
    // Reset status configuration to force refresh
    this.statusConfig = {
      allStatuses: [],
      activeStatuses: [],
      statusMatches: [],
      unmatchedStatuses: [],
      lastUpdated: null,
    };
  }

  getMethodMap() {
    return {
      items: "getItems",
      "inactive-items": "getInactiveItems",
      "active-items": "getActiveItems",
      "all-items": "getAllItems",
      outfits: "getOutfits",
      "usage-log": "getUsageLog",
      inspiration: "getInspiration",
      "shopping-list": "getShoppingList",
      avoids: "getAvoids",
      statuses: "getAllItemStatuses",
      "status-config": "updateStatusConfiguration",
    };
  }

  // === UTILITY METHODS ===

  _calculateStatusBreakdown(items) {
    const breakdown = {};

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      breakdown[status] = (breakdown[status] || 0) + 1;
    });

    return breakdown;
  }

  // === DEBUG AND MONITORING ===

  async getDebugData() {
    try {
      const [
        activeItems,
        inactiveItems,
        outfits,
        usageLog,
        analytics,
        costAnalysis,
        allStatuses,
        categorizedItems,
      ] = await Promise.all([
        this.getActiveItems(false),
        this.getInactiveItems(false),
        this.getOutfits(false),
        this.getUsageLog(false),
        this.analyzeUsagePatterns(false),
        this.getCostAnalysis(false),
        this.getAllItemStatuses(false),
        this.getCategorizedItems(false),
      ]);

      return {
        rawDataCounts: {
          activeItems: activeItems?.length || 0,
          inactiveItems: inactiveItems?.length || 0,
          outfits: outfits?.length || 0,
          usageLog: usageLog?.length || 0,
        },
        statusInfo: {
          allStatuses,
          activeStatusesConfig: this.getActiveStatusesConfig(),
          statusBreakdown: analytics?.statusBreakdown || {},
          categorizedCounts: {
            active: categorizedItems.active.length,
            inactive: categorizedItems.inactive.length,
          },
          dynamicMatching: {
            matches: this.statusConfig.statusMatches,
            unmatchedStatuses: this.statusConfig.unmatchedStatuses,
            targetPatterns: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
          },
        },
        configuration: this.getWardrobeConfig(),
        sampleData: {
          firstActiveItem: activeItems?.[0] || null,
          firstUsageEntry: usageLog?.[0] || null,
        },
        analyticsStructure: {
          hasAnalytics: !!analytics,
          analyticsKeys: analytics ? Object.keys(analytics) : [],
          totalActiveItems: analytics?.activeItemsCount,
          totalUsageEntries: analytics?.totalUsageEntries,
          seasonalTrends: analytics?.seasonalTrends,
          occasionTrends: analytics?.occasionTrends,
          departmentBreakdown: analytics?.departmentBreakdown,
          activeItemsFormula: analytics?.activeItemsFormula,
        },
        costAnalysisStructure: {
          hasCostAnalysis: !!costAnalysis,
          costAnalysisKeys: costAnalysis ? Object.keys(costAnalysis) : [],
          totalInvestment: costAnalysis?.totalInvestment,
        },
        cacheStatus: this.getCacheStatus(),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Error generating debug data:", error);
      throw new Error(`Debug data generation failed: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      const cacheStatus = this.getCacheStatus();
      const hasData = Object.values(cacheStatus).some(
        (status) => status.recordCount > 0
      );

      return {
        status: "healthy",
        hasData,
        statusConfigured: this.statusConfig.activeStatuses.length > 0,
        totalStatuses: this.statusConfig.allStatuses.length,
        activeStatuses: this.statusConfig.activeStatuses.length,
        cacheStatus,
        timestamp: new Date().toISOString(),
        version: "2.1.0",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = WardrobeService;
