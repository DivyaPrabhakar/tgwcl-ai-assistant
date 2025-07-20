// backend/config/constants.js - Refactored main constants file

// === CORE CONFIGURATION ===
const WARDROBE_CONFIG = require("./wardrobeConfig");

// === SERVICES AND UTILITIES ===
const FIELD_EXTRACTORS_MODULE = require("../services/fieldExtractors");
const STATUS_MATCHER = require("./statusMatcher");

// === UTILITY MODULES ===
const DEBUG_UTILS = require("./debugUtils");

// === STATUS UTILITIES (avoiding circular dependency) ===
const STATUS_UTILS = {
  /**
   * Check if a status is considered active
   */
  isActive: (status, activeStatuses) => {
    return activeStatuses.includes(status);
  },

  /**
   * Get formula information for active items calculation
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
   */
  categorizeByStatus: (items, activeStatuses) => {
    // Get extractors directly to avoid circular dependency
    const extractors = FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

    const categorized = items.reduce(
      (acc, item) => {
        const status = extractors.extractStatus(item);
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
   * Get status breakdown statistics
   */
  getStatusBreakdown: (items) => {
    const extractors = FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

    const breakdown = {};
    let totalProcessed = 0;

    items.forEach((item) => {
      const status = extractors.extractStatus(item);
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
    } else {
      console.warn("⚠️ Status configuration issues:", issues);
    }

    return issues;
  },

  /**
   * Find items with problematic statuses
   */
  findProblematicItems: (items) => {
    const extractors = FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

    return items.filter((item) => {
      const status = extractors.extractStatus(item);
      return STATUS_UTILS.isProblematicStatus(status);
    });
  },

  /**
   * Check if a status is problematic
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

// === EXPORTS ===

// Get the flat extractors object for backward compatibility
const FIELD_EXTRACTORS = FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

module.exports = {
  // Core configuration
  WARDROBE_CONFIG,

  // Field extractors (both flat and modular)
  FIELD_EXTRACTORS,
  FIELD_EXTRACTORS_MODULE,

  // Status utilities
  STATUS_MATCHER,
  STATUS_UTILS,

  // Debug utilities
  DEBUG_UTILS,
};
