// services/wardrobeService.js - Updated to use refactored status manager

const CacheManager = require("./cacheManager");
const AirtableService = require("./airtableService");
const AnalyticsService = require("./analyticsService");
const StatusManager = require("./statusManager");
const StatusCoordinator = require("./statusCoordinator");
const DataManager = require("./dataManager");

class WardrobeService {
  constructor() {
    this.initializeServices();
    console.log("✅ WardrobeService initialized with refactored architecture");
  }

  // === INITIALIZATION ===

  initializeServices() {
    // Initialize core services
    this.cacheManager = new CacheManager();
    this.airtableService = new AirtableService(this.cacheManager);

    // Initialize status management (now slim!)
    this.statusManager = new StatusManager();
    this.statusCoordinator = new StatusCoordinator(this.statusManager);

    // Initialize data manager
    this.dataManager = new DataManager(
      this.airtableService,
      this.statusManager
    );

    // Initialize analytics
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
      console.log("📭 No cached data found. Server ready for API requests.");
    } else {
      console.log("📚 Using cached data. Server ready!");
      console.log(
        `🏷️ ${this.statusManager.getAllStatuses().length} unique statuses`
      );
      console.log(
        `✅ ${this.statusManager.getActiveStatuses().length} active statuses`
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

  // === STATUS-BASED OPERATIONS ===

  async getItemsByStatus(statuses = [], forceRefresh = false) {
    return await this.dataManager.getItemsByStatus(statuses, forceRefresh);
  }

  async getActiveItems(forceRefresh = false) {
    return await this.dataManager.getActiveItems(forceRefresh);
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

  // === STATUS INFORMATION (SIMPLIFIED) ===

  getActiveStatuses() {
    return this.statusManager.getActiveStatuses();
  }

  getActiveStatusesConfig() {
    return this.statusManager.getStatusConfiguration();
  }

  // === ANALYTICS ===

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

  // === CACHE MANAGEMENT ===

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
          version: "4.0.0 - Refactored Status Manager",
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
          statusCoordinator: !!this.statusCoordinator,
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
        version: "4.0.0 - Refactored",
        services: {
          statusManager: "active",
          statusCoordinator: "active",
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
        version: "4.0.0 - Refactored",
      };
    }
  }

  // === SERVICE ACCESS ===

  getStatusManager() {
    return this.statusManager;
  }

  getStatusCoordinator() {
    return this.statusCoordinator;
  }

  getDataManager() {
    return this.dataManager;
  }

  getAnalyticsService() {
    return this.analyticsService;
  }
}

module.exports = WardrobeService;
