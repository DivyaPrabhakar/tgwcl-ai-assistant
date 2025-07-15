// services/statusCoordinator.js - Handles complex multi-module operations

class StatusCoordinator {
  constructor(statusManager) {
    this.statusManager = statusManager;
    this.config = statusManager.getConfigModule();
    this.analyzer = statusManager.getAnalyzerModule();
    this.operations = statusManager.getOperationsModule();

    this.log("Status Coordinator initialized");
  }

  // === COMPLEX ANALYSIS OPERATIONS ===

  /**
   * Process items with comprehensive status analysis
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

  /**
   * Generate complete status report
   */
  generateStatusReport(items) {
    return this.analyzer.generateReport(items);
  }

  /**
   * Get status transition suggestions
   */
  getStatusTransitionSuggestions(currentStatus) {
    return this.analyzer.getTransitionSuggestions(currentStatus);
  }

  /**
   * Get items needing review
   */
  getItemsNeedingStatusReview(items) {
    return this.analyzer.getItemsNeedingReview(items);
  }

  /**
   * Analyze status patterns
   */
  analyzeStatusPatterns(items) {
    return this.analyzer.analyzePatterns(items);
  }

  // === HEALTH CHECK ===

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
        analyzer: { status: "active" },
        operations: { status: "active" },
      },
      summary: {
        totalStatuses: this.config.getAllStatuses().length,
        activeStatuses: this.config.getActiveStatuses().length,
        configurationValid: configValidation.length === 0,
      },
    };
  }

  // === DEBUG AND TESTING ===

  debugStatusMatching(sampleStatuses) {
    this.config.debugMatching(sampleStatuses);
  }

  testStatusOperations(sampleItems) {
    console.log("\n=== COMPREHENSIVE STATUS TEST ===");

    try {
      // Test configuration
      const configStats = this.config.getStats();
      console.log(
        `✅ Configuration: ${configStats.counts.totalStatuses} statuses`
      );

      // Test operations
      this.operations.testOperations(sampleItems);

      // Test analyzer
      this.analyzer.testAnalyzer(sampleItems);

      // Test comprehensive processing
      const processed = this.processItems(sampleItems);
      console.log(
        `✅ Comprehensive: ${processed.summary.totalItems} items processed`
      );

      console.log("✅ All status modules working correctly!");
    } catch (error) {
      console.error("❌ Status test failed:", error.message);
    }

    console.log("=== END TEST ===\n");
  }

  // === LOGGING ===

  log(message) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] StatusCoordinator: ${message}`);
  }
}

module.exports = StatusCoordinator;
