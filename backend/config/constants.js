// config/constants.js - Clean and modular constants

// === IMPORT FIELD EXTRACTORS ===
const FIELD_EXTRACTORS_MODULE = require("../services/fieldExtractors");

// === WARDROBE CONFIGURATION ===
const WARDROBE_CONFIG = {
  // Target active statuses for fuzzy matching
  TARGET_ACTIVE_STATUSES: [
    "active",
    "in laundry",
    "at cleaners",
    "lent",
    "borrowed",
    "needs repair",
  ],

  // Cache settings
  CACHE: {
    DEFAULT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    FETCH_TIMEOUT: 30000, // 30 seconds
    MAX_PAGES: 50,
  },

  // UI Configuration
  UI: {
    ITEMS_PER_PAGE: 12,
    MAX_FILTER_RESULTS: 100,
    DASHBOARD_REFRESH_INTERVAL: 300000, // 5 minutes
  },

  // Analytics configuration
  ANALYTICS: {
    TOP_ITEMS_COUNT: 10,
    SEASONS: {
      spring: [2, 3, 4], // March, April, May
      summer: [5, 6, 7], // June, July, August
      fall: [8, 9, 10], // September, October, November
      winter: [11, 0, 1], // December, January, February
    },
  },
};

// === FIELD EXTRACTORS (FROM EXTERNAL MODULE) ===
// Get the flat extractors object for backward compatibility
const FIELD_EXTRACTORS = FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

// === STATUS MATCHING UTILITIES ===
const STATUS_MATCHER = {
  /**
   * Calculate similarity between two strings (0-1, 1 = exact match)
   */
  calculateSimilarity: (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter((word) => words2.includes(word));

    if (commonWords.length > 0) {
      return (
        0.6 * (commonWords.length / Math.max(words1.length, words2.length))
      );
    }

    // Character overlap (simple)
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }

    return (matches / Math.max(s1.length, s2.length)) * 0.4;
  },

  /**
   * Find the best match for a status from target list
   */
  findBestMatch: (actualStatus, targetStatuses, threshold = 0.5) => {
    let bestMatch = null;
    let bestScore = 0;

    for (const target of targetStatuses) {
      const score = STATUS_MATCHER.calculateSimilarity(actualStatus, target);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = { target, score };
      }
    }

    return bestMatch;
  },

  /**
   * Determine active statuses from actual Airtable data
   */
  determineActiveStatuses: (allActualStatuses) => {
    const activeMatches = [];
    const targetStatuses = WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES;

    console.log("🔍 STATUS MATCHING PROCESS:");
    console.log("📝 Input statuses:", allActualStatuses);
    console.log("🎯 Target patterns:", targetStatuses);

    for (const actualStatus of allActualStatuses) {
      const match = STATUS_MATCHER.findBestMatch(
        actualStatus,
        targetStatuses,
        0.5
      );

      if (match) {
        activeMatches.push({
          actual: actualStatus,
          target: match.target,
          score: match.score,
        });
        console.log(
          `✅ "${actualStatus}" → "${match.target}" (${(
            match.score * 100
          ).toFixed(0)}%)`
        );
      } else {
        console.log(`❌ No match for "${actualStatus}"`);
      }
    }

    const activeStatuses = activeMatches.map((m) => m.actual);
    const unmatchedStatuses = allActualStatuses.filter(
      (s) => !activeStatuses.includes(s)
    );

    console.log("🎯 RESULTS:");
    console.log(`   Active: ${activeStatuses.join(", ")}`);
    console.log(`   Unmatched: ${unmatchedStatuses.join(", ")}`);

    return {
      activeStatuses,
      matches: activeMatches,
      unmatchedStatuses,
    };
  },
};

// === STATUS UTILITIES ===
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
   */
  getStatusBreakdown: (items) => {
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
};

// === DEBUG UTILITIES ===
const DEBUG_UTILS = {
  /**
   * Test field extractors on sample data
   */
  testFieldExtractors: (sampleItem, category = null) => {
    console.log("\n=== FIELD EXTRACTOR TEST ===");
    console.log("Sample item:", JSON.stringify(sampleItem, null, 2));

    const extractors = category
      ? FIELD_EXTRACTORS_MODULE.utils.getByCategory(category)
      : FIELD_EXTRACTORS;

    const results = {};

    for (const [extractorName, extractorFunc] of Object.entries(extractors)) {
      if (typeof extractorFunc === "function") {
        try {
          const result = extractorFunc(sampleItem);
          results[extractorName] = result;

          const isMissing =
            typeof result === "string" && result.startsWith("cannot");
          console.log(`${isMissing ? "❌" : "✅"} ${extractorName}: ${result}`);
        } catch (error) {
          results[extractorName] = `ERROR: ${error.message}`;
          console.log(`💥 ${extractorName}: ERROR - ${error.message}`);
        }
      }
    }

    console.log("=== END TEST ===\n");
    return results;
  },

  /**
   * Analyze data quality across records
   */
  analyzeDataQuality: (records, recordType = "items") => {
    if (!Array.isArray(records) || records.length === 0) {
      console.warn("No records provided for data quality analysis");
      return {};
    }

    console.log(
      `\n=== DATA QUALITY ANALYSIS (${recordType.toUpperCase()}) ===`
    );
    console.log(`Total records: ${records.length}`);

    // Get coverage report
    const coverage =
      FIELD_EXTRACTORS_MODULE.utils.analyzeFieldCoverage(records);

    // Sort by missing percentage
    const sortedCoverage = Object.entries(coverage).sort(
      ([, a], [, b]) => b.percentage - a.percentage
    );

    console.log("\nField Coverage Report:");
    console.log(
      "Field Name".padEnd(30) +
        "Found".padEnd(10) +
        "Missing".padEnd(10) +
        "Coverage"
    );
    console.log("-".repeat(60));

    sortedCoverage.forEach(([fieldName, stats]) => {
      const coverage = `${stats.percentage}%`;
      const status =
        stats.percentage >= 80 ? "✅" : stats.percentage >= 50 ? "⚠️" : "❌";

      console.log(
        `${status} ${fieldName.padEnd(25)} ${stats.found
          .toString()
          .padEnd(8)} ${stats.missing.toString().padEnd(8)} ${coverage}`
      );
    });

    const wellCoveredFields = sortedCoverage.filter(
      ([, stats]) => stats.percentage >= 80
    ).length;
    const poorlyCoveredFields = sortedCoverage.filter(
      ([, stats]) => stats.percentage < 50
    ).length;

    console.log(`\nSummary:`);
    console.log(`  Well covered (80%+): ${wellCoveredFields} fields`);
    console.log(`  Poorly covered (<50%): ${poorlyCoveredFields} fields`);
    console.log("=== END ANALYSIS ===\n");

    return coverage;
  },

  /**
   * Compare two records to see field differences
   */
  compareRecords: (
    record1,
    record2,
    label1 = "Record 1",
    label2 = "Record 2"
  ) => {
    console.log(`\n=== RECORD COMPARISON: ${label1} vs ${label2} ===`);

    const allFields = new Set([
      ...Object.keys(record1),
      ...Object.keys(record2),
    ]);

    allFields.forEach((field) => {
      const val1 = record1[field];
      const val2 = record2[field];

      if (val1 !== val2) {
        console.log(`${field}:`);
        console.log(`  ${label1}: ${JSON.stringify(val1)}`);
        console.log(`  ${label2}: ${JSON.stringify(val2)}`);
      }
    });

    console.log("=== END COMPARISON ===\n");
  },

  /**
   * Get configuration summary
   */
  getConfigSummary: () => {
    return {
      targetActiveStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      cacheConfig: WARDROBE_CONFIG.CACHE,
      uiConfig: WARDROBE_CONFIG.UI,
      analyticsConfig: WARDROBE_CONFIG.ANALYTICS,
      availableExtractorCategories:
        FIELD_EXTRACTORS_MODULE.utils.getCategories(),
      totalExtractors: Object.keys(FIELD_EXTRACTORS).length,
    };
  },
};

module.exports = {
  WARDROBE_CONFIG,
  FIELD_EXTRACTORS,
  FIELD_EXTRACTORS_MODULE, // Export the full module for advanced usage
  STATUS_MATCHER,
  STATUS_UTILS,
  DEBUG_UTILS,
};
