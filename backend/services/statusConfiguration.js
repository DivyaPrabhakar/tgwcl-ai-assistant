// services/statusConfiguration.js - Handles status configuration and matching

const {
  STATUS_MATCHER,
  FIELD_EXTRACTORS,
  WARDROBE_CONFIG,
} = require("../config/constants");

class StatusConfiguration {
  constructor() {
    this.config = {
      allStatuses: [],
      activeStatuses: [],
      statusMatches: [],
      unmatchedStatuses: [],
      lastUpdated: null,
    };

    this.log("Status Configuration initialized");
  }

  // === CORE CONFIGURATION METHODS ===

  /**
   * Update status configuration from item data
   * @param {Array} allItems - All items from Airtable
   * @returns {Object} - Updated status configuration
   */
  async updateFromItems(allItems) {
    try {
      this.log("🔄 Updating status configuration...");

      // Extract unique statuses
      const allStatuses = this.extractUniqueStatuses(allItems);
      this.log(`📊 Found ${allStatuses.length} unique statuses:`, allStatuses);

      // Use fuzzy matching to determine active statuses
      const matchingResult =
        STATUS_MATCHER.determineActiveStatuses(allStatuses);

      // Update configuration
      this.config = {
        allStatuses,
        activeStatuses: matchingResult.activeStatuses,
        statusMatches: matchingResult.matches,
        unmatchedStatuses: matchingResult.unmatchedStatuses,
        lastUpdated: new Date().toISOString(),
      };

      this.logConfigUpdate();
      return this.config;
    } catch (error) {
      this.logError("Error updating status configuration:", error);
      return this.getFallbackConfig();
    }
  }

  /**
   * Extract unique statuses from items
   * @param {Array} items - Items to analyze
   * @returns {Array} - Unique statuses
   */
  extractUniqueStatuses(items) {
    return [
      ...new Set(
        items
          .map((item) => FIELD_EXTRACTORS.extractStatus(item))
          .filter((status) => this.isValidStatus(status))
      ),
    ].sort();
  }

  /**
   * Check if a status is valid
   * @param {string} status - Status to check
   * @returns {boolean} - Whether status is valid
   */
  isValidStatus(status) {
    return (
      status &&
      status !== "unknown" &&
      status !== "" &&
      !status.startsWith("cannot")
    );
  }

  /**
   * Get fallback configuration if update fails
   * @returns {Object} - Fallback configuration
   */
  getFallbackConfig() {
    this.config = {
      allStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      activeStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      statusMatches: [],
      unmatchedStatuses: [],
      lastUpdated: new Date().toISOString(),
      error: "Fallback configuration used",
    };

    this.log("⚠️ Using fallback configuration");
    return this.config;
  }

  // === GETTERS ===

  /**
   * Get all statuses
   * @returns {Array} - All unique statuses
   */
  getAllStatuses() {
    return this.config.allStatuses;
  }

  /**
   * Get active statuses
   * @returns {Array} - Active statuses
   */
  getActiveStatuses() {
    return this.config.activeStatuses;
  }

  /**
   * Get complete configuration
   * @returns {Object} - Complete configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      targetPatterns: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      description: "Statuses dynamically determined from Airtable data",
    };
  }

  /**
   * Check if a status is active
   * @param {string} status - Status to check
   * @returns {boolean} - Whether the status is active
   */
  isActiveStatus(status) {
    return this.config.activeStatuses.includes(status);
  }

  // === VALIDATION ===

  /**
   * Validate configuration
   * @returns {Array} - Array of validation issues (empty if valid)
   */
  validate() {
    const issues = [];

    if (!this.config) {
      issues.push("Configuration is null/undefined");
      return issues;
    }

    if (!Array.isArray(this.config.activeStatuses)) {
      issues.push("activeStatuses is not an array");
    } else if (this.config.activeStatuses.length === 0) {
      issues.push("No active statuses configured");
    }

    if (!Array.isArray(this.config.allStatuses)) {
      issues.push("allStatuses is not an array");
    }

    if (this.config.activeStatuses.length > this.config.allStatuses.length) {
      issues.push("More active statuses than total statuses");
    }

    return issues;
  }

  /**
   * Check if configuration needs update
   * @returns {boolean} - Whether update is needed
   */
  needsUpdate() {
    if (!this.config.lastUpdated) return true;

    const hoursSinceUpdate =
      (Date.now() - new Date(this.config.lastUpdated)) / (1000 * 60 * 60);
    return hoursSinceUpdate > 24; // Update daily
  }

  // === DEBUG METHODS ===

  /**
   * Debug status matching
   * @param {Array} sampleStatuses - Statuses to test
   */
  debugMatching(sampleStatuses) {
    // Debug logging removed
  }

  /**
   * Get configuration statistics
   * @returns {Object} - Configuration statistics
   */
  getStats() {
    const validation = this.validate();

    return {
      isValid: validation.length === 0,
      validation: validation,
      needsUpdate: this.needsUpdate(),
      counts: {
        totalStatuses: this.config.allStatuses.length,
        activeStatuses: this.config.activeStatuses.length,
        matchedStatuses: this.config.statusMatches.length,
        unmatchedStatuses: this.config.unmatchedStatuses.length,
      },
      percentages: {
        activePercentage:
          this.config.allStatuses.length > 0
            ? Math.round(
                (this.config.activeStatuses.length /
                  this.config.allStatuses.length) *
                  100
              )
            : 0,
      },
      lastUpdated: this.config.lastUpdated,
    };
  }

  // === LOGGING ===

  log(message, data = null) {
    // Logging removed
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] StatusConfig ERROR: ${message}`);
    if (error) console.error("  💥", error);
  }

  logConfigUpdate() {
    this.log("✅ Configuration updated:", {
      total: this.config.allStatuses.length,
      active: this.config.activeStatuses.length,
      matched: this.config.statusMatches.length,
      unmatched: this.config.unmatchedStatuses.length,
    });
  }
}

module.exports = StatusConfiguration;
