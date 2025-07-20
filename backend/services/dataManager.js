// services/dataManager.js - Handles all data fetching and basic operations

class DataManager {
  constructor(airtableService, statusManager) {
    this.airtableService = airtableService;
    this.statusManager = statusManager;
    this.log("Data Manager initialized");
  }

  // === BASIC DATA FETCHING ===

  /**
   * Get items with automatic status update
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Items
   */
  async getItems(forceRefresh = false) {
    this.log("Fetching items");
    return await this.airtableService.getItems(forceRefresh);
  }

  /**
   * Get inactive items
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Inactive items
   */
  async getInactiveItems(forceRefresh = false) {
    this.log("Fetching inactive items");
    return await this.airtableService.getInactiveItems(forceRefresh);
  }

  /**
   * Get all items (active + inactive) with status update
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - All items
   */
  async getAllItems(forceRefresh = false) {
    this.log("Fetching all items");
    const allItems = await this.airtableService.getAllItems(forceRefresh);

    // Update status configuration if needed
    if (forceRefresh || this.statusManager.needsUpdate()) {
      await this.statusManager.updateStatusConfiguration(allItems);
    }

    return allItems;
  }

  /**
   * Get outfits
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Outfits
   */
  async getOutfits(forceRefresh = false) {
    this.log("Fetching outfits");
    return await this.airtableService.getOutfits(forceRefresh);
  }

  /**
   * Get usage log
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Usage log entries
   */
  async getUsageLog(forceRefresh = false) {
    this.log("Fetching usage log");
    return await this.airtableService.getUsageLog(forceRefresh);
  }

  /**
   * Get inspiration data
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Inspiration entries
   */
  async getInspiration(forceRefresh = false) {
    this.log("Fetching inspiration");
    return await this.airtableService.getInspiration(forceRefresh);
  }

  /**
   * Get shopping list
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Shopping list items
   */
  async getShoppingList(forceRefresh = false) {
    this.log("Fetching shopping list");
    return await this.airtableService.getShoppingList(forceRefresh);
  }

  /**
   * Get avoids list
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Items to avoid
   */
  async getAvoids(forceRefresh = false) {
    this.log("Fetching avoids list");
    return await this.airtableService.getAvoids(forceRefresh);
  }

  // === STATUS-BASED DATA OPERATIONS ===

  /**
   * Get items filtered by specific statuses
   * @param {Array} statuses - Statuses to filter by
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Filtered items
   */
  async getItemsByStatus(statuses = [], forceRefresh = false) {
    if (!Array.isArray(statuses)) {
      throw new Error("Statuses must be an array");
    }

    const allItems = await this.getAllItems(forceRefresh);

    if (statuses.length === 0) {
      return allItems;
    }

    return this.statusManager.filterItemsByStatus(allItems, statuses);
  }

  /**
   * Get active items based on current status configuration
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Active items
   */
  async getActiveItems(forceRefresh = false) {
    const allItems = await this.getAllItems(forceRefresh);
    const activeStatuses = this.statusManager.getActiveStatuses();

    this.log(
      `Getting active items using statuses: ${activeStatuses.join(", ")}`
    );

    return this.statusManager.filterItemsByStatus(allItems, activeStatuses);
  }

  /**
   * Get inactive items based on current status configuration
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - Inactive items
   */
  async getInactiveItemsByStatus(forceRefresh = false) {
    const allItems = await this.getAllItems(forceRefresh);
    const activeStatuses = this.statusManager.getActiveStatuses();

    const inactiveItems = allItems.filter((item) => {
      const itemStatus = this.statusManager.constructor.extractStatus
        ? this.statusManager.constructor.extractStatus(item)
        : item.status;
      return !activeStatuses.includes(itemStatus);
    });

    this.log(`Found ${inactiveItems.length} inactive items`);
    return inactiveItems;
  }

  /**
   * Get items categorized by active/inactive status
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Object} - Categorized items {active: [], inactive: []}
   */
  async getCategorizedItems(forceRefresh = false) {
    const allItems = await this.getAllItems(forceRefresh);
    return this.statusManager.categorizeItemsByStatus(allItems);
  }

  // === STATUS INFORMATION ===

  /**
   * Get all unique item statuses
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Array} - All unique statuses
   */
  async getAllItemStatuses(forceRefresh = false) {
    // Ensure we have fresh data and updated status config
    await this.getAllItems(forceRefresh);
    return this.statusManager.getAllStatuses();
  }

  /**
   * Update status configuration manually
   * @param {boolean} forceRefresh - Whether to force data refresh
   * @returns {Object} - Updated status configuration
   */
  async updateStatusConfiguration(forceRefresh = false) {
    this.log("🔄 Manual status configuration update requested");

    const allItems = await this.getAllItems(forceRefresh);
    return await this.statusManager.updateStatusConfiguration(allItems);
  }

  // === UTILITY METHODS ===

  /**
   * Get comprehensive data summary
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {Object} - Data summary
   */
  async getDataSummary(forceRefresh = false) {
    const startTime = Date.now();

    const [allItems, outfits, usageLog, inspiration, shoppingList, avoids] =
      await Promise.all([
        this.getAllItems(forceRefresh),
        this.getOutfits(forceRefresh),
        this.getUsageLog(forceRefresh),
        this.getInspiration(forceRefresh),
        this.getShoppingList(forceRefresh),
        this.getAvoids(forceRefresh),
      ]);

    const categorizedItems =
      this.statusManager.categorizeItemsByStatus(allItems);
    const statusBreakdown = this.statusManager.getStatusBreakdown(allItems);

    const summary = {
      timestamp: new Date().toISOString(),
      fetchDuration: Date.now() - startTime,
      counts: {
        totalItems: allItems.length,
        activeItems: categorizedItems.active.length,
        inactiveItems: categorizedItems.inactive.length,
        outfits: outfits.length,
        usageEntries: usageLog.length,
        inspirationItems: inspiration.length,
        shoppingListItems: shoppingList.length,
        avoidsItems: avoids.length,
      },
      statusInfo: {
        uniqueStatuses: this.statusManager.getAllStatuses().length,
        activeStatuses: this.statusManager.getActiveStatuses().length,
        statusBreakdown: statusBreakdown,
      },
      statusConfiguration: this.statusManager.getStatusConfiguration(),
    };

    this.log("Data summary generated:", {
      totalItems: summary.counts.totalItems,
      fetchTime: summary.fetchDuration,
    });

    return summary;
  }

  /**
   * Test data connections
   * @returns {Object} - Connection test results
   */
  async testConnections() {
    this.log("🔍 Testing data connections...");

    const results = {
      airtableConnection: null,
      dataFetching: {},
      statusManager: null,
    };

    try {
      // Test Airtable connection
      results.airtableConnection = await this.airtableService.testConnection();

      // Test data fetching
      const testMethods = [
        { name: "items", method: "getItems" },
        { name: "outfits", method: "getOutfits" },
        { name: "usageLog", method: "getUsageLog" },
      ];

      for (const test of testMethods) {
        try {
          const data = await this[test.method](false);
          results.dataFetching[test.name] = {
            success: true,
            count: data.length,
            hasData: data.length > 0,
          };
        } catch (error) {
          results.dataFetching[test.name] = {
            success: false,
            error: error.message,
          };
        }
      }

      // Test status manager
      results.statusManager = {
        isConfigured: this.statusManager.getAllStatuses().length > 0,
        activeStatuses: this.statusManager.getActiveStatuses().length,
        validation: this.statusManager.validateStatusConfiguration(),
      };
    } catch (error) {
      this.logError("Connection test failed:", error);
      results.error = error.message;
    }

    return results;
  }

  // === CACHE MANAGEMENT ===

  /**
   * Clear all cached data
   */
  async clearAllCache() {
    this.log("🗑️ Clearing all cached data");
    await this.airtableService.cacheManager.clearAllCache();

    // Reset status configuration
    this.statusManager.statusConfig = {
      allStatuses: [],
      activeStatuses: [],
      statusMatches: [],
      unmatchedStatuses: [],
      lastUpdated: null,
    };
  }

  /**
   * Get cache status
   * @returns {Object} - Cache status information
   */
  getCacheStatus() {
    const baseStatus = this.airtableService.cacheManager.getCacheStatus();
    const statusInfo = this.statusManager.getStatusStats();

    return {
      ...baseStatus,
      statusManager: statusInfo,
      fieldNormalizationEnabled: true,
    };
  }

  // === LOGGING ===

  log(message, data = null) {
    // Logging removed
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] DataManager ERROR: ${message}`);
    if (error) {
      console.error("  💥", error);
    }
  }
}

module.exports = DataManager;
