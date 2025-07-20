// services/statusOperations.js - Handles status-based operations on items

const { STATUS_UTILS, FIELD_EXTRACTORS } = require("../config/constants");

class StatusOperations {
  constructor(statusConfiguration) {
    this.statusConfig = statusConfiguration;
    this.log("Status Operations initialized");
  }

  // === ITEM CATEGORIZATION ===

  /**
   * Categorize items by active/inactive status
   * @param {Array} items - Items to categorize
   * @returns {Object} - Categorized items {active: [], inactive: []}
   */
  categorizeItems(items) {
    const activeStatuses = this.statusConfig.getActiveStatuses();
    const categorized = STATUS_UTILS.categorizeByStatus(items, activeStatuses);

    this.log(`📊 Categorized ${items.length} items:`, {
      active: categorized.active.length,
      inactive: categorized.inactive.length,
    });

    return categorized;
  }

  /**
   * Get only active items
   * @param {Array} items - Items to filter
   * @returns {Array} - Active items
   */
  getActiveItems(items) {
    const activeStatuses = this.statusConfig.getActiveStatuses();
    return this.filterByStatuses(items, activeStatuses);
  }

  /**
   * Get only inactive items
   * @param {Array} items - Items to filter
   * @returns {Array} - Inactive items
   */
  getInactiveItems(items) {
    const activeStatuses = this.statusConfig.getActiveStatuses();

    const inactiveItems = items.filter((item) => {
      const itemStatus = FIELD_EXTRACTORS.extractStatus(item);
      return !activeStatuses.includes(itemStatus);
    });

    this.log(
      `🔍 Found ${inactiveItems.length} inactive items from ${items.length} total`
    );
    return inactiveItems;
  }

  // === FILTERING OPERATIONS ===

  /**
   * Filter items by specific statuses
   * @param {Array} items - Items to filter
   * @param {Array} statuses - Statuses to filter by
   * @returns {Array} - Filtered items
   */
  filterByStatuses(items, statuses) {
    if (!Array.isArray(statuses) || statuses.length === 0) {
      this.log("No statuses provided, returning all items");
      return items;
    }

    const filtered = items.filter((item) => {
      const itemStatus = FIELD_EXTRACTORS.extractStatus(item);
      return statuses.includes(itemStatus);
    });

    this.log(
      `🔍 Filtered ${items.length} → ${
        filtered.length
      } items with statuses: ${statuses.join(", ")}`
    );
    return filtered;
  }

  /**
   * Filter items by single status
   * @param {Array} items - Items to filter
   * @param {string} status - Status to filter by
   * @returns {Array} - Filtered items
   */
  filterByStatus(items, status) {
    return this.filterByStatuses(items, [status]);
  }

  /**
   * Filter items excluding specific statuses
   * @param {Array} items - Items to filter
   * @param {Array} excludeStatuses - Statuses to exclude
   * @returns {Array} - Filtered items
   */
  filterExcludingStatuses(items, excludeStatuses) {
    if (!Array.isArray(excludeStatuses) || excludeStatuses.length === 0) {
      return items;
    }

    const filtered = items.filter((item) => {
      const itemStatus = FIELD_EXTRACTORS.extractStatus(item);
      return !excludeStatuses.includes(itemStatus);
    });

    this.log(
      `🔍 Filtered excluding ${excludeStatuses.join(", ")}: ${items.length} → ${
        filtered.length
      } items`
    );
    return filtered;
  }

  // === STATUS QUERIES ===

  /**
   * Get items with problematic statuses
   * @param {Array} items - Items to check
   * @returns {Array} - Items with problems
   */
  getProblematicItems(items) {
    return items.filter((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      return this.isProblematicStatus(status);
    });
  }

  /**
   * Check if status is problematic
   * @param {string} status - Status to check
   * @returns {boolean} - Whether status is problematic
   */
  isProblematicStatus(status) {
    return (
      status.startsWith("cannot") ||
      status === "unknown" ||
      status === "" ||
      status === null
    );
  }

  /**
   * Get items by status pattern (fuzzy matching)
   * @param {Array} items - Items to search
   * @param {string} pattern - Pattern to match
   * @returns {Array} - Matching items
   */
  getItemsByStatusPattern(items, pattern) {
    if (!pattern) return [];

    const patternLower = pattern.toLowerCase();

    return items.filter((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item).toLowerCase();
      return status.includes(patternLower);
    });
  }

  // === BULK OPERATIONS ===

  /**
   * Group items by their status
   * @param {Array} items - Items to group
   * @returns {Object} - Items grouped by status
   */
  groupByStatus(items) {
    const groups = {};

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);

      if (!groups[status]) {
        groups[status] = [];
      }

      groups[status].push(item);
    });

    this.log(
      `📦 Grouped ${items.length} items into ${
        Object.keys(groups).length
      } status groups`
    );
    return groups;
  }

  /**
   * Get status counts for items
   * @param {Array} items - Items to count
   * @returns {Object} - Status counts
   */
  getStatusCounts(items) {
    const counts = {};

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get items with rare statuses (appearing less than threshold)
   * @param {Array} items - Items to analyze
   * @param {number} threshold - Minimum count threshold (default: 2)
   * @returns {Array} - Items with rare statuses
   */
  getItemsWithRareStatuses(items, threshold = 2) {
    const statusCounts = this.getStatusCounts(items);
    const rareStatuses = Object.keys(statusCounts).filter(
      (status) => statusCounts[status] < threshold
    );

    return items.filter((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      return rareStatuses.includes(status);
    });
  }

  // === VALIDATION OPERATIONS ===

  /**
   * Validate items have recognized statuses
   * @param {Array} items - Items to validate
   * @returns {Object} - Validation results
   */
  validateItemStatuses(items) {
    const allValidStatuses = this.statusConfig.getAllStatuses();
    const results = {
      valid: [],
      invalid: [],
      unknown: [],
    };

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);

      if (this.isProblematicStatus(status)) {
        results.invalid.push({
          item: FIELD_EXTRACTORS.extractItemName(item),
          status,
          issue: "Problematic status",
        });
      } else if (!allValidStatuses.includes(status)) {
        results.unknown.push({
          item: FIELD_EXTRACTORS.extractItemName(item),
          status,
          issue: "Unrecognized status",
        });
      } else {
        results.valid.push(item);
      }
    });

    this.log(
      `✅ Validation: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.unknown.length} unknown`
    );
    return results;
  }

  // === UTILITY OPERATIONS ===

  /**
   * Get summary of status operations for items
   * @param {Array} items - Items to summarize
   * @returns {Object} - Status operations summary
   */
  getSummary(items) {
    const categorized = this.categorizeItems(items);
    const problematic = this.getProblematicItems(items);
    const statusCounts = this.getStatusCounts(items);
    const validation = this.validateItemStatuses(items);

    return {
      totalItems: items.length,
      categorization: {
        active: categorized.active.length,
        inactive: categorized.inactive.length,
      },
      statusCounts,
      problematicItems: problematic.length,
      validation: {
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        unknown: validation.unknown.length,
      },
      uniqueStatuses: Object.keys(statusCounts).length,
    };
  }

  // === TESTING ===

  /**
   * Test status operations with sample data
   * @param {Array} sampleItems - Sample items for testing
   */
  testOperations(sampleItems) {
    // Test logging removed
  }

  // === LOGGING ===

  log(message, data = null) {
    // Logging removed
  }
}

module.exports = StatusOperations;
