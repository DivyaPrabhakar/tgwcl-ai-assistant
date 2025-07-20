// config/statusUtils.js - Updated with better getActiveFormula

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
   * Get formula information for active items calculation - UPDATED VERSION
   * @param {Array} activeStatuses - Active statuses found in data
   * @param {Array} matches - Status matches from fuzzy matching
   * @returns {Object} - Formula information
   */
  getActiveFormula: (activeStatuses, matches = []) => {
    // Get all target patterns (what you want to be active)
    const allTargetPatterns = WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES;

    // Show which patterns are currently matched vs not found
    const matchedPatterns = matches.map((m) => m.target);
    const unmatchedPatterns = allTargetPatterns.filter(
      (pattern) => !matchedPatterns.includes(pattern)
    );

    // Helper function to explain what each status means
    const getStatusExplanation = (pattern) => {
      const explanations = {
        active: "ready to wear immediately",
        "ready to sell": "prepared for selling but still owned",
        lent: "temporarily lent to someone else",
        "in laundry": "being washed or dried",
        "at cleaners": "at dry cleaning or professional cleaning",
        "needs repair": "need fixing but still part of your wardrobe",
        borrowed: "temporarily borrowed from someone else",
      };

      return explanations[pattern] || "part of your active wardrobe";
    };

    // Create explanation that includes ALL intended active statuses
    const explanation = `Active items include all items you currently own and can potentially wear:

CURRENTLY FOUND IN YOUR DATA:
${matches
  .map(
    (match) =>
      `• ${match.actual} (${match.target}) - items ${getStatusExplanation(
        match.target
      )}`
  )
  .join("\n")}

${
  unmatchedPatterns.length > 0
    ? `
CONFIGURED AS ACTIVE (but no items found yet):
${unmatchedPatterns
  .map((pattern) => `• ${pattern} - items ${getStatusExplanation(pattern)}`)
  .join("\n")}`
    : ""
}

This ensures comprehensive tracking of your wardrobe including temporarily unavailable items.`;

    return {
      description: "Items with status matching active patterns",
      activeStatuses: activeStatuses,
      targetPatterns: allTargetPatterns,
      matches: matches,
      formula: `COUNT(items WHERE status IN [${activeStatuses
        .map((s) => `"${s}"`)
        .join(", ")}])`,
      explanation: explanation,

      // Include all target patterns for UI display
      allConfiguredActiveStatuses: allTargetPatterns,
      currentlyMatchedStatuses: activeStatuses,
      unmatchedButConfiguredStatuses: unmatchedPatterns,
    };
  },

  /**
   * Categorize items by active/inactive status
   * @param {Array} items - Items to categorize
   * @param {Array} activeStatuses - List of active statuses
   * @returns {Object} - Categorized items
   */
  categorizeByStatus: (items, activeStatuses) => {
    const { FIELD_EXTRACTORS } = require("./constants");

    const categorized = items.reduce(
      (acc, item) => {
        const status = FIELD_EXTRACTORS.extractStatus(item);
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
   * @param {Array} items - Items to analyze
   * @returns {Object} - Status breakdown
   */
  getStatusBreakdown: (items) => {
    const { FIELD_EXTRACTORS } = require("./constants");

    const breakdown = {};
    let totalProcessed = 0;

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
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
    const { FIELD_EXTRACTORS } = require("./constants");

    return items.filter((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
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
