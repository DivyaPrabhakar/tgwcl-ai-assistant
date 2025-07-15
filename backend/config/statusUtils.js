// config/statusUtils.js - Status utility functions

const WARDROBE_CONFIG = require("./wardrobeConfig");

const STATUS_UTILS = {
  /**
   * Check if a status is considered active
   * @param {string} status - Status to check
   * @param {Array} activeStatuses - List of active statuses
   * @returns {boolean} - Whether status is active
   */
  isActive: (status, activeStatuses) => {
    return activeStatuses.includes(status);
  },

  /**
   * Get formula information for active items calculation
   * @param {Array} activeStatuses - Active statuses
   * @param {Array} matches - Status matches from fuzzy matching
   * @returns {Object} - Formula information
   */
  getActiveFormula: (activeStatuses, matches = []) => ({
    description: "Items with status matching active patterns",
    activeStatuses: activeStatuses,
    targetPatterns: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
    matches: matches,
    formula: `COUNT(items WHERE status IN [${activeStatuses
      .map((s) => `"${s}"`)
      .join(", ")}])`,
    explanation:
      "Active items include those ready to wear or temporarily unavailable but still owned",
  }),

  /**
   * Categorize items by active/inactive status
   * @param {Array} items - Items to categorize
   * @param {Array} activeStatuses - List of active statuses
   * @returns {Object} - Categorized items
   */
  categorizeByStatus: (items, activeStatuses) => {
    const categorized = items.reduce(
      (acc, item) => {
        const status = STATUS_UTILS.extractStatus(item);
        if (STATUS_UTILS.isActive(status, activeStatuses)) {
          acc.active.push(item);
        } else {
          acc.inactive.push(item);
        }
        return acc;
      },
      { active: [], inactive: [], unknown: [] }
    );

    // Log categorization results
    console.log("📊 STATUS CATEGORIZATION:");
    console.log(`   Active: ${categorized.active.length} items`);
    console.log(`   Inactive: ${categorized.inactive.length} items`);
    console.log(`   Total: ${items.length} items`);

    return categorized;
  },

  /**
   * Extract status from item (temporary - will be replaced by field extractors)
   * @param {Object} item - Item to extract status from
   * @returns {string} - Item status
   */
  extractStatus: (item) => {
    // This is a temporary method that will be replaced by proper field extractors
    return item.status || "unknown";
  },

  /**
   * Get status breakdown statistics
   * @param {Array} items - Items to analyze
   * @returns {Object} - Status breakdown
   */
  getStatusBreakdown: (items) => {
    const breakdown = {};
    let totalProcessed = 0;

    items.forEach((item) => {
      const status = STATUS_UTILS.extractStatus(item);
      breakdown[status] = (breakdown[status] || 0) + 1;
      totalProcessed++;
    });

    console.log("📈 STATUS BREAKDOWN:");
    Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([status, count]) => {
        const percentage = ((count / totalProcessed) * 100).toFixed(1);
        console.log(`   ${status}: ${count} (${percentage}%)`);
      });

    return breakdown;
  },

  /**
   * Validate status configuration
   * @param {Object} statusConfig - Status configuration to validate
   * @returns {Array} - Array of validation issues (empty if valid)
   */
  validateStatusConfig: (statusConfig) => {
    const issues = [];

    if (!statusConfig) {
      issues.push("Status configuration is null/undefined");
      return issues;
    }

    if (!Array.isArray(statusConfig.activeStatuses)) {
      issues.push("activeStatuses is not an array");
    } else if (statusConfig.activeStatuses.length === 0) {
      issues.push("No active statuses configured");
    }

    if (!Array.isArray(statusConfig.allStatuses)) {
      issues.push("allStatuses is not an array");
    }

    if (issues.length === 0) {
      console.log("✅ Status configuration is valid");
    } else {
      console.warn("⚠️ Status configuration issues:", issues);
    }

    return issues;
  },

  /**
   * Get status transition suggestions
   * @param {string} currentStatus - Current status
   * @param {Array} allStatuses - All available statuses
   * @param {Array} activeStatuses - Active statuses
   * @returns {Array} - Suggested transitions
   */
  getTransitionSuggestions: (currentStatus, allStatuses, activeStatuses) => {
    const suggestions = [];

    if (STATUS_UTILS.isActive(currentStatus, activeStatuses)) {
      // Suggest inactive transitions
      const inactiveStatuses = allStatuses.filter(
        (s) => !activeStatuses.includes(s)
      );
      suggestions.push(...inactiveStatuses.slice(0, 3));
    } else {
      // Suggest active transitions
      suggestions.push(...activeStatuses.slice(0, 3));
    }

    return suggestions;
  },

  /**
   * Calculate status distribution percentages
   * @param {Object} statusBreakdown - Status count breakdown
   * @returns {Object} - Status distribution with percentages
   */
  calculateStatusDistribution: (statusBreakdown) => {
    const total = Object.values(statusBreakdown).reduce(
      (sum, count) => sum + count,
      0
    );
    const distribution = {};

    if (total === 0) return distribution;

    Object.entries(statusBreakdown).forEach(([status, count]) => {
      distribution[status] = {
        count,
        percentage: Math.round((count / total) * 100),
      };
    });

    return distribution;
  },

  /**
   * Find items with problematic statuses
   * @param {Array} items - Items to check
   * @returns {Array} - Items with problematic statuses
   */
  findProblematicItems: (items) => {
    return items.filter((item) => {
      const status = STATUS_UTILS.extractStatus(item);
      return STATUS_UTILS.isProblematicStatus(status);
    });
  },

  /**
   * Check if a status is problematic
   * @param {string} status - Status to check
   * @returns {boolean} - Whether status is problematic
   */
  isProblematicStatus: (status) => {
    return (
      !status ||
      status === "unknown" ||
      status === "" ||
      status.startsWith("cannot")
    );
  },

  /**
   * Get status health metrics
   * @param {Array} items - Items to analyze
   * @param {Array} activeStatuses - Active statuses
   * @returns {Object} - Status health metrics
   */
  getStatusHealth: (items, activeStatuses) => {
    const breakdown = STATUS_UTILS.getStatusBreakdown(items);
    const problematic = STATUS_UTILS.findProblematicItems(items);
    const categorized = STATUS_UTILS.categorizeByStatus(items, activeStatuses);

    return {
      totalItems: items.length,
      validItems: items.length - problematic.length,
      problematicItems: problematic.length,
      activeItems: categorized.active.length,
      inactiveItems: categorized.inactive.length,
      uniqueStatuses: Object.keys(breakdown).length,
      healthScore:
        items.length > 0
          ? Math.round(
              ((items.length - problematic.length) / items.length) * 100
            )
          : 0,
    };
  },
};

module.exports = STATUS_UTILS;
