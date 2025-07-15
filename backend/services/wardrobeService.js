// services/wardrobeService.js - Simplified main service

const CacheManager = require("./cacheManager");
const AirtableService = require("./airtableService");
const AnalyticsService = require("./analyticsService");
const StatusManager = require("./statusManager");
const DataManager = require("./dataManager");

class WardrobeService {
  constructor() {
    this.initializeServices();
    console.log("✅ WardrobeService initialized with modular architecture");
  }

  // === INITIALIZATION ===

  initializeServices() {
    // Initialize core services
    this.cacheManager = new CacheManager();
    this.airtableService = new AirtableService(this.cacheManager);

    // Initialize managers
    this.statusManager = new StatusManager();
    this.dataManager = new DataManager(
      this.airtableService,
      this.statusManager
    );

    // Initialize analytics (depends on other services)
    this.analyticsService = new AnalyticsService(this.airtableService);
  }

  async initialize() {
    await this.cacheManager.ensureDataDir();
    const totalCachedRecords = await this.cacheManager.loadAllCachedData();

    // Initialize status configuration from cached data
    if (totalCachedRecords > 0) {
      const allItems = await this.dataManager.getAllItems(false);
      await this.statusManager.updateStatusConfiguration(allItems);
    }

    this.logInitializationResults(totalCachedRecords);
    return totalCachedRecords;
  }

  logInitializationResults(totalCachedRecords) {
    if (totalCachedRecords === 0) {
      console.log(
        "📭 No cached data found. Server is ready - use API endpoints to fetch data when quota allows."
      );
    } else {
      console.log("📚 Using existing cached data. Server ready for chat!");
      console.log(
        `🏷️ Detected ${
          this.statusManager.getAllStatuses().length
        } unique statuses`
      );
      console.log(
        `✅ Identified ${
          this.statusManager.getActiveStatuses().length
        } as active statuses`
      );
    }
  }

  // === DATA OPERATIONS (DELEGATED TO DATA MANAGER) ===

  async getItems(forceRefresh = false) {
    return await this.dataManager.getItems(forceRefresh);
  }

  async getInactiveItems(forceRefresh = false) {
    return await this.dataManager.getInactiveItems(forceRefresh);
  }

  async getAllItems(forceRefresh = false) {
    return await this.dataManager.getAllItems(forceRefresh);
  }

  async getOutfits(forceRefresh = false) {
    return await this.dataManager.getOutfits(forceRefresh);
  }

  async getUsageLog(forceRefresh = false) {
    return await this.dataManager.getUsageLog(forceRefresh);
  }

  async getInspiration(forceRefresh = false) {
    return await this.dataManager.getInspiration(forceRefresh);
  }

  async getShoppingList(forceRefresh = false) {
    return await this.dataManager.getShoppingList(forceRefresh);
  }

  async getAvoids(forceRefresh = false) {
    return await this.dataManager.getAvoids(forceRefresh);
  }

  // === STATUS-BASED OPERATIONS (DELEGATED TO DATA MANAGER) ===

  async getItemsByStatus(statuses = [], forceRefresh = false) {
    return await this.dataManager.getItemsByStatus(statuses, forceRefresh);
  }

  async getActiveItems(forceRefresh = false) {
    return await this.dataManager.getActiveItems(forceRefresh);
  }

  async getInactiveItemsByStatus(forceRefresh = false) {
    return await this.dataManager.getInactiveItemsByStatus(forceRefresh);
  }

  async getCategorizedItems(forceRefresh = false) {
    return await this.dataManager.getCategorizedItems(forceRefresh);
  }

  async getAllItemStatuses(forceRefresh = false) {
    return await this.dataManager.getAllItemStatuses(forceRefresh);
  }

  async updateStatusConfiguration(forceRefresh = false) {
    return await this.dataManager.updateStatusConfiguration(forceRefresh);
  }

  // === STATUS INFORMATION (DELEGATED TO STATUS MANAGER) ===

  getActiveStatuses() {
    return this.statusManager.getActiveStatuses();
  }

  getActiveStatusesConfig() {
    return this.statusManager.getStatusConfiguration();
  }

  // === ANALYTICS (DELEGATED TO ANALYTICS SERVICE) ===

  async analyzeUsagePatterns(forceRefresh = false) {
    const statusConfig = this.statusManager.getStatusConfiguration();
    const analytics = await this.analyticsService.analyzeUsagePatterns(
      forceRefresh,
      statusConfig
    );

    // Add status information
    const allItems = await this.dataManager.getAllItems(forceRefresh);
    const statusBreakdown = this.statusManager.getStatusBreakdown(allItems);
    const categorizedItems =
      this.statusManager.categorizeItemsByStatus(allItems);

    return {
      ...analytics,
      statusBreakdown,
      activeItemsCount: categorizedItems.active.length,
      inactiveItemsCount: categorizedItems.inactive.length,
      statusConfig: statusConfig,
      activeItemsFormula: statusConfig.formula,
    };
  }

  async getCostAnalysis(forceRefresh = false) {
    const statusConfig = this.statusManager.getStatusConfiguration();
    return await this.analyticsService.getCostAnalysis(
      forceRefresh,
      statusConfig
    );
  }

  // === CONFIGURATION ===

  getWardrobeConfig() {
    const { WARDROBE_CONFIG } = require("../config/constants");

    return {
      targetActiveStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      currentStatusConfig: this.statusManager.statusConfig,
      uiConfig: WARDROBE_CONFIG.UI,
      analyticsConfig: WARDROBE_CONFIG.ANALYTICS,
      fieldNormalizationEnabled: true,
    };
  }

  // === CACHE MANAGEMENT (DELEGATED) ===

  getCacheStatus() {
    return this.dataManager.getCacheStatus();
  }

  async clearAllCache() {
    await this.dataManager.clearAllCache();
  }

  // === UTILITY METHODS ===

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

  // === DEBUG AND MONITORING ===

  async getDebugData() {
    try {
      const [dataSummary, connectionTests, statusStats] = await Promise.all([
        this.dataManager.getDataSummary(false),
        this.dataManager.testConnections(),
        Promise.resolve(this.statusManager.getStatusStats()),
      ]);

      // Get field normalizer stats
      const fieldNormalizer = this.airtableService.getFieldNormalizer();
      const allItems = await this.dataManager.getAllItems(false);
      const fieldStats = fieldNormalizer.getFieldStats(allItems);

      return {
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString(),
          version: "4.0.0 - Modular Architecture",
        },
        dataSummary,
        connectionTests,
        statusStats,
        fieldNormalization: {
          enabled: true,
          stats: fieldStats,
          sampleNormalizedItem: allItems[0] || null,
        },
        services: {
          cacheManager: !!this.cacheManager,
          airtableService: !!this.airtableService,
          statusManager: !!this.statusManager,
          dataManager: !!this.dataManager,
          analyticsService: !!this.analyticsService,
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
        (status) => status && status.recordCount > 0
      );

      const statusValidation = this.statusManager.validateStatusConfiguration();

      return {
        status: "healthy",
        hasData,
        statusConfigured: this.statusManager.getActiveStatuses().length > 0,
        totalStatuses: this.statusManager.getAllStatuses().length,
        activeStatuses: this.statusManager.getActiveStatuses().length,
        statusValidation:
          statusValidation.length === 0 ? "valid" : statusValidation,
        cacheStatus,
        fieldNormalizationEnabled: true,
        timestamp: new Date().toISOString(),
        version: "4.0.0 - Modular",
        services: {
          statusManager: "active",
          dataManager: "active",
          analyticsService: "active",
          airtableService: "active",
          cacheManager: "active",
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
        version: "4.0.0 - Modular",
      };
    }
  }

  // === SERVICE ACCESS FOR ADVANCED USAGE ===

  getStatusManager() {
    return this.statusManager;
  }

  getDataManager() {
    return this.dataManager;
  }

  getAnalyticsService() {
    return this.analyticsService;
  }

  getAirtableService() {
    return this.airtableService;
  }

  getCacheManager() {
    return this.cacheManager;
  }
}

module.exports = WardrobeService;
