// services/statusAnalyzer.js - Handles status analysis and patterns

const { FIELD_EXTRACTORS } = require("../config/constants");

class StatusAnalyzer {
  constructor(statusConfiguration) {
    this.statusConfig = statusConfiguration;
    this.log("Status Analyzer initialized");
  }

  // === BREAKDOWN ANALYSIS ===

  /**
   * Get status breakdown statistics
   * @param {Array} items - Items to analyze
   * @returns {Object} - Status breakdown
   */
  getStatusBreakdown(items) {
    const breakdown = {};
    let totalProcessed = 0;

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      if (this.isValidStatus(status)) {
        breakdown[status] = (breakdown[status] || 0) + 1;
        totalProcessed++;
      }
    });

    this.log(
      `📈 Status breakdown calculated: ${
        Object.keys(breakdown).length
      } statuses, ${totalProcessed} items`
    );
    return breakdown;
  }

  /**
   * Check if status is valid for analysis
   * @param {string} status - Status to check
   * @returns {boolean} - Whether status is valid
   */
  isValidStatus(status) {
    return status && !status.startsWith("cannot");
  }

  // === PATTERN ANALYSIS ===

  /**
   * Analyze status usage patterns
   * @param {Array} items - Items to analyze
   * @returns {Object} - Status usage analysis
   */
  analyzePatterns(items) {
    const breakdown = this.getStatusBreakdown(items);
    const totalItems = Object.values(breakdown).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalItems === 0) {
      return this.getEmptyPatterns();
    }

    return {
      totalItems,
      mostCommonStatus: this.findMostCommonStatus(breakdown, totalItems),
      leastCommonStatus: this.findLeastCommonStatus(breakdown, totalItems),
      activePercentage: this.calculateActivePercentage(items, totalItems),
      inactivePercentage: this.calculateInactivePercentage(items, totalItems),
      statusDistribution: this.createStatusDistribution(breakdown, totalItems),
    };
  }

  /**
   * Get empty patterns structure
   * @returns {Object} - Empty patterns
   */
  getEmptyPatterns() {
    return {
      totalItems: 0,
      mostCommonStatus: null,
      leastCommonStatus: null,
      activePercentage: 0,
      inactivePercentage: 0,
      statusDistribution: {},
    };
  }

  /**
   * Find most common status
   * @param {Object} breakdown - Status breakdown
   * @param {number} totalItems - Total items
   * @returns {Object} - Most common status info
   */
  findMostCommonStatus(breakdown, totalItems) {
    const sorted = Object.entries(breakdown).sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) return null;

    const [status, count] = sorted[0];
    return {
      status,
      count,
      percentage: Math.round((count / totalItems) * 100),
    };
  }

  /**
   * Find least common status
   * @param {Object} breakdown - Status breakdown
   * @param {number} totalItems - Total items
   * @returns {Object} - Least common status info
   */
  findLeastCommonStatus(breakdown, totalItems) {
    const sorted = Object.entries(breakdown).sort(([, a], [, b]) => a - b);

    if (sorted.length === 0) return null;

    const [status, count] = sorted[0];
    return {
      status,
      count,
      percentage: Math.round((count / totalItems) * 100),
    };
  }

  /**
   * Calculate active percentage
   * @param {Array} items - Items to analyze
   * @param {number} totalItems - Total items
   * @returns {number} - Active percentage
   */
  calculateActivePercentage(items, totalItems) {
    const activeItems = items.filter((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      return this.statusConfig.isActiveStatus(status);
    });

    return Math.round((activeItems.length / totalItems) * 100);
  }

  /**
   * Calculate inactive percentage
   * @param {Array} items - Items to analyze
   * @param {number} totalItems - Total items
   * @returns {number} - Inactive percentage
   */
  calculateInactivePercentage(items, totalItems) {
    return 100 - this.calculateActivePercentage(items, totalItems);
  }

  /**
   * Create status distribution with percentages
   * @param {Object} breakdown - Status breakdown
   * @param {number} totalItems - Total items
   * @returns {Object} - Status distribution
   */
  createStatusDistribution(breakdown, totalItems) {
    const distribution = {};

    Object.entries(breakdown).forEach(([status, count]) => {
      distribution[status] = {
        count,
        percentage: Math.round((count / totalItems) * 100),
        isActive: this.statusConfig.isActiveStatus(status),
      };
    });

    return distribution;
  }

  // === ITEM REVIEW ===

  /**
   * Find items that need status review
   * @param {Array} items - Items to analyze
   * @returns {Array} - Items needing review
   */
  getItemsNeedingReview(items) {
    const flaggedItems = [];

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      const itemName = FIELD_EXTRACTORS.extractItemName(item);

      if (this.needsStatusReview(status)) {
        flaggedItems.push({
          item: itemName,
          currentStatus: status,
          issue: this.getStatusIssue(status),
          suggestions: this.getStatusSuggestions(status),
        });
      }
    });

    this.log(`🔍 Found ${flaggedItems.length} items needing status review`);
    return flaggedItems;
  }

  /**
   * Check if item needs status review
   * @param {string} status - Status to check
   * @returns {boolean} - Whether item needs review
   */
  needsStatusReview(status) {
    return (
      status.startsWith("cannot") ||
      status === "unknown" ||
      status === "" ||
      status === null
    );
  }

  /**
   * Get issue description for status
   * @param {string} status - Status with issue
   * @returns {string} - Issue description
   */
  getStatusIssue(status) {
    if (status.startsWith("cannot")) return "Missing or invalid status field";
    if (status === "unknown") return "Status marked as unknown";
    if (status === "" || status === null) return "Empty status field";
    return "Status needs review";
  }

  /**
   * Get status suggestions
   * @param {string} currentStatus - Current status
   * @returns {Array} - Status suggestions
   */
  getStatusSuggestions(currentStatus) {
    return this.statusConfig.getAllStatuses().slice(0, 3);
  }

  // === TRANSITION ANALYSIS ===

  /**
   * Get status transition suggestions
   * @param {string} currentStatus - Current status
   * @returns {Array} - Suggested transitions
   */
  getTransitionSuggestions(currentStatus) {
    const suggestions = [];

    if (this.statusConfig.isActiveStatus(currentStatus)) {
      // Suggest inactive transitions
      const unmatchedStatuses =
        this.statusConfig.getConfiguration().unmatchedStatuses || [];
      suggestions.push(
        ...unmatchedStatuses.filter(
          (status) =>
            status.includes("sold") ||
            status.includes("donated") ||
            status.includes("discarded")
        )
      );
    } else {
      // Suggest active transitions
      suggestions.push(...this.statusConfig.getActiveStatuses());
    }

    return suggestions.slice(0, 5);
  }

  // === COMPREHENSIVE REPORTS ===

  /**
   * Generate comprehensive status report
   * @param {Array} items - Items to analyze
   * @returns {Object} - Complete status report
   */
  generateReport(items) {
    const patterns = this.analyzePatterns(items);
    const breakdown = this.getStatusBreakdown(items);
    const needingReview = this.getItemsNeedingReview(items);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalItems: items.length,
        validItems: patterns.totalItems,
        itemsNeedingReview: needingReview.length,
      },
      breakdown,
      patterns,
      itemsNeedingReview: needingReview,
      recommendations: this.generateRecommendations(patterns, needingReview),
    };

    this.log(
      `📊 Generated status report: ${report.summary.totalItems} items analyzed`
    );
    return report;
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} patterns - Pattern analysis
   * @param {Array} needingReview - Items needing review
   * @returns {Array} - Recommendations
   */
  generateRecommendations(patterns, needingReview) {
    const recommendations = [];

    if (needingReview.length > 0) {
      recommendations.push({
        type: "data_quality",
        message: `${needingReview.length} items need status updates`,
        priority: "high",
      });
    }

    if (patterns.activePercentage < 50) {
      recommendations.push({
        type: "status_review",
        message: "Consider reviewing inactive items for potential reactivation",
        priority: "medium",
      });
    }

    if (patterns.totalItems === 0) {
      recommendations.push({
        type: "configuration",
        message: "No valid status data found - check status configuration",
        priority: "high",
      });
    }

    return recommendations;
  }

  // === TESTING ===

  /**
   * Test analyzer with sample data
   * @param {Array} sampleItems - Sample items
   */
  testAnalyzer(sampleItems) {
    console.log("\n=== STATUS ANALYZER TEST ===");

    try {
      const breakdown = this.getStatusBreakdown(sampleItems);
      console.log(`✅ Breakdown: ${Object.keys(breakdown).length} statuses`);

      const patterns = this.analyzePatterns(sampleItems);
      console.log(`✅ Patterns: ${patterns.activePercentage}% active`);

      const needingReview = this.getItemsNeedingReview(sampleItems);
      console.log(`✅ Review: ${needingReview.length} items flagged`);

      const report = this.generateReport(sampleItems);
      console.log(
        `✅ Report: ${report.recommendations.length} recommendations`
      );

      console.log("Status analyzer working correctly!");
    } catch (error) {
      console.error("❌ Analyzer test failed:", error.message);
    }

    console.log("=== END TEST ===\n");
  }

  // === LOGGING ===

  log(message, data = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] StatusAnalyzer: ${message}`);
    if (data) console.log("  📊", data);
  }
}

module.exports = StatusAnalyzer;
