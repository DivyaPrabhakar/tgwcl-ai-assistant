// services/statusManager.js - Slim coordinator

const StatusConfiguration = require("./statusConfiguration");
const StatusAnalyzer = require("./statusAnalyzer");
const StatusOperations = require("./statusOperations");

class StatusManager {
  constructor() {
    this.config = new StatusConfiguration();
    this.analyzer = new StatusAnalyzer(this.config);
    this.operations = new StatusOperations(this.config);

    this.log("Status Manager initialized");
  }

  // === PRIMARY METHODS (What most code needs) ===

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

  categorizeItemsByStatus(items) {
    return this.operations.categorizeItems(items);
  }

  filterItemsByStatus(items, statuses) {
    return this.operations.filterByStatuses(items, statuses);
  }

  getStatusBreakdown(items) {
    return this.analyzer.getStatusBreakdown(items);
  }

  validateStatusConfiguration() {
    return this.config.validate();
  }

  // === CONVENIENCE METHODS ===

  needsUpdate() {
    return this.config.needsUpdate();
  }

  getStatusStats() {
    return {
      configuration: this.config.getStats(),
      modules: { config: "active", analyzer: "active", operations: "active" },
      version: "2.0.0 - Modular",
    };
  }

  // === MODULE ACCESS (for advanced usage) ===

  getConfigModule() {
    return this.config;
  }
  getAnalyzerModule() {
    return this.analyzer;
  }
  getOperationsModule() {
    return this.operations;
  }

  // === LOGGING ===

  log(message) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] StatusManager: ${message}`);
  }
}

module.exports = StatusManager;
