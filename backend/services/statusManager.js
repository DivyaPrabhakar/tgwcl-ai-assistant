// services/statusManager.js - Simple coordinator for status modules

const StatusConfiguration = require("./statusConfiguration");
const StatusAnalyzer = require("./statusAnalyzer");
const StatusOperations = require("./config/statusOperations");

class StatusManager {
  constructor() {
    // Initialize specialized modules
    this.config = new StatusConfiguration();
    this.analyzer = new StatusAnalyzer(this.config);
    this.operations = new StatusOperations(this.config);

    this.log("Status Manager initialized with modular architecture");
  }

  // === CONFIGURATION DELEGATION ===

  async updateStatusConfiguration(allItems) {
    return await this.config.updateFromItems(allItems);
  }

  getAllStatuses() {
    return this.config.getAllStatuses();
  }

  getActiveStatuses() {
    return this.config.getActiveStatuses();
  }

  getStatusConfiguration() {
    return this.config.getConfiguration();
  }

  needsUpdate() {
    return this.config.needsUpdate();
  }

  // === OPERATIONS DELEGATION ===

  categorizeItemsByStatus(items) {
    return this.operations.categorizeItems(items);
  }

  filterItemsByStatus(items, statuses) {
    return this.operations.filterByStatuses(items, statuses);
  }

  // === ANALYSIS DELEGATION ===

  getStatusBreakdown(items) {
    return this.analyzer.getStatusBreakdown(items);
  }

  analyzeStatusPatterns(items) {
    return this.analyzer.analyzePatterns(items);
  }

  getItemsNeedingStatusReview(items) {
    return this.analyzer.getItemsNeedingReview(items);
  }

  generateStatusReport(items) {
    return this.analyzer.generateReport(items);
  }

  // === VALIDATION ===

  validateStatusConfiguration() {
    return this.config.validate();
  }

  // === CONVENIENCE METHODS ===

  /**
   * Get comprehensive status statistics
   * @returns {Object} - Complete status statistics
   */
  getStatusStats() {
    const configStats = this.config.getStats();

    return {
      configuration: configStats,
      modules: {
        config: "active",
        analyzer: "active",
        operations: "active",
      },
      version: "2.0.0 - Modular",
    };
  }

  /**
   * Get status transition suggestions
   * @param {string} currentStatus - Current status
   * @returns {Array} - Suggested transitions
   */
  getStatusTransitionSuggestions(currentStatus) {
    return this.analyzer.getTransitionSuggestions(currentStatus);
  }

  /**
   * Process items with comprehensive status analysis
   * @param {Array} items - Items to process
   * @returns {Object} - Complete processing results
   */
  processItems(items) {
    const results = {
      summary: this.operations.getSummary(items),
      categorization: this.operations.categorizeItems(items),
      breakdown: this.analyzer.getStatusBreakdown(items),
      patterns: this.analyzer.analyzePatterns(items),
      needingReview: this.analyzer.getItemsNeedingReview(items),
      validation: this.operations.validateItemStatuses(items),
    };

    this.log(`📊 Processed ${items.length} items with comprehensive analysis`);
    return results;
  }

  // === DEBUG METHODS ===

  /**
   * Debug status matching process
   * @param {Array} sampleStatuses - Sample statuses to test
   */
  debugStatusMatching(sampleStatuses) {
    this.config.debugMatching(sampleStatuses);
  }

  /**
   * Test all status operations
   * @param {Array} sampleItems - Sample items for testing
   */
  testStatusOperations(sampleItems) {
    console.log("\n=== COMPREHENSIVE STATUS MANAGER TEST ===");

    try {
      // Test configuration
      console.log("Testing configuration...");
      const configStats = this.config.getStats();
      console.log(
        `✅ Configuration: ${configStats.counts.totalStatuses} statuses`
      );

      // Test operations
      console.log("Testing operations...");
      this.operations.testOperations(sampleItems);

      // Test analyzer
      console.log("Testing analyzer...");
      this.analyzer.testAnalyzer(sampleItems);

      // Test comprehensive processing
      console.log("Testing comprehensive processing...");
      const processed = this.processItems(sampleItems);
      console.log(
        `✅ Comprehensive: ${processed.summary.totalItems} items processed`
      );

      console.log("✅ All status manager modules working correctly!");
    } catch (error) {
      console.error("❌ Status manager test failed:", error.message);
    }

    console.log("=== END COMPREHENSIVE TEST ===\n");
  }

  /**
   * Get health check for all modules
   * @returns {Object} - Health status
   */
  healthCheck() {
    const configValidation = this.config.validate();

    return {
      status: configValidation.length === 0 ? "healthy" : "issues",
      modules: {
        configuration: {
          status: "active",
          validation: configValidation,
          lastUpdated: this.config.getConfiguration().lastUpdated,
        },
        analyzer: {
          status: "active",
        },
        operations: {
          status: "active",
        },
      },
      summary: {
        totalStatuses: this.config.getAllStatuses().length,
        activeStatuses: this.config.getActiveStatuses().length,
        configurationValid: configValidation.length === 0,
      },
    };
  }

  // === MODULE ACCESS ===

  /**
   * Get configuration module for advanced usage
   * @returns {StatusConfiguration} - Configuration module
   */
  getConfigurationModule() {
    return this.config;
  }

  /**
   * Get analyzer module for advanced usage
   * @returns {StatusAnalyzer} - Analyzer module
   */
  getAnalyzerModule() {
    return this.analyzer;
  }

  /**
   * Get operations module for advanced usage
   * @returns {StatusOperations} - Operations module
   */
  getOperationsModule() {
    return this.operations;
  }

  // === LOGGING ===

  log(message, data = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] StatusManager: ${message}`);
    if (data) console.log("  📊", data);
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] StatusManager ERROR: ${message}`);
    if (error) console.error("  💥", error);
  }
}

module.exports = StatusManager;
