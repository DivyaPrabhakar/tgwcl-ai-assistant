// config/debugUtils.js - Clean debug and testing utilities

const DEBUG_UTILS = {
  /**
   * Test field extractors on sample data
   * @param {Object} sampleItem - Sample item to test
   * @param {string} category - Category name (optional)
   */
  testFieldExtractors: (sampleItem, category = null) => {
    const FIELD_EXTRACTORS_MODULE = require("../services/fieldExtractors");

    console.log("\n=== FIELD EXTRACTOR TEST ===");
    console.log("Sample item:", JSON.stringify(sampleItem, null, 2));

    const extractors = category
      ? FIELD_EXTRACTORS_MODULE.utils.getByCategory(category)
      : FIELD_EXTRACTORS_MODULE.utils.getAllExtractors();

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
   * @param {Array} records - Records to analyze
   * @param {string} recordType - Type of records (for logging)
   */
  analyzeDataQuality: (records, recordType = "items") => {
    const FIELD_EXTRACTORS_MODULE = require("../services/fieldExtractors");

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
      const coveragePercent = `${stats.percentage}%`;
      const status =
        stats.percentage >= 80 ? "✅" : stats.percentage >= 50 ? "⚠️" : "❌";

      console.log(
        `${status} ${fieldName.padEnd(25)} ${stats.found
          .toString()
          .padEnd(8)} ${stats.missing.toString().padEnd(8)} ${coveragePercent}`
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
   * @param {Object} record1 - First record
   * @param {Object} record2 - Second record
   * @param {string} label1 - Label for first record
   * @param {string} label2 - Label for second record
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
    const WARDROBE_CONFIG = require("./wardrobeConfig");
    const FIELD_EXTRACTORS_MODULE = require("../services/fieldExtractors");

    return {
      targetActiveStatuses: WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES,
      cacheConfig: WARDROBE_CONFIG.CACHE,
      uiConfig: WARDROBE_CONFIG.UI,
      analyticsConfig: WARDROBE_CONFIG.ANALYTICS,
      availableExtractorCategories:
        FIELD_EXTRACTORS_MODULE.utils.getCategories(),
      totalExtractors: Object.keys(
        FIELD_EXTRACTORS_MODULE.utils.getAllExtractors()
      ).length,
    };
  },

  /**
   * Performance timer utility
   * @param {string} label - Timer label
   * @returns {Object} - Timer object with stop method
   */
  startTimer: (label) => {
    const startTime = Date.now();

    return {
      stop: () => {
        const duration = Date.now() - startTime;
        console.log(`⏱️ ${label}: ${duration}ms`);
        return duration;
      },
    };
  },

  /**
   * Memory usage reporter
   * @param {string} label - Label for memory report
   */
  reportMemoryUsage: (label = "Memory Usage") => {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const usage = process.memoryUsage();
      console.log(`📊 ${label}:`);
      console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
      console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
      console.log(
        `  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`
      );
    }
  },

  /**
   * Validate data structure
   * @param {*} data - Data to validate
   * @param {Object} schema - Expected schema
   * @returns {Array} - Validation errors
   */
  validateDataStructure: (data, schema) => {
    const errors = [];

    if (!data) {
      errors.push("Data is null or undefined");
      return errors;
    }

    // Check required fields
    if (schema.required) {
      schema.required.forEach((field) => {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    // Check field types
    if (schema.types) {
      Object.entries(schema.types).forEach(([field, expectedType]) => {
        if (data[field] !== undefined && typeof data[field] !== expectedType) {
          errors.push(
            `Field ${field} should be ${expectedType}, got ${typeof data[
              field
            ]}`
          );
        }
      });
    }

    return errors;
  },

  /**
   * Generate sample data for testing
   * @param {number} count - Number of items to generate
   * @returns {Array} - Sample items
   */
  generateSampleItems: (count = 5) => {
    const statuses = [
      "active",
      "inactive",
      "donated",
      "in laundry",
      "needs repair",
    ];
    const categories = ["tops", "bottoms", "shoes", "accessories"];
    const brands = ["Nike", "Adidas", "Zara", "H&M", "Uniqlo"];

    return Array.from({ length: count }, (_, i) => ({
      id: `item_${i}`,
      item_name: `Sample Item ${i + 1}`,
      status: statuses[i % statuses.length],
      department: categories[i % categories.length],
      brand: brands[i % brands.length],
      purchase_price: Math.floor(Math.random() * 200) + 20,
      color_value: i % 2 === 0 ? "blue" : "red",
    }));
  },

  /**
   * Test all status operations with sample data
   * @param {Array} sampleItems - Sample items
   */
  testStatusOperations: (sampleItems) => {
    const STATUS_UTILS = require("./statusUtils");

    console.log("\n=== STATUS OPERATIONS TEST ===");

    try {
      const activeStatuses = ["active", "in laundry", "needs repair"];

      // Test categorization
      const categorized = STATUS_UTILS.categorizeByStatus(
        sampleItems,
        activeStatuses
      );
      console.log(
        `✅ Categorization: ${categorized.active.length} active, ${categorized.inactive.length} inactive`
      );

      // Test breakdown
      const breakdown = STATUS_UTILS.getStatusBreakdown(sampleItems);
      console.log(
        `✅ Breakdown: ${Object.keys(breakdown).length} unique statuses`
      );

      // Test health metrics
      const health = STATUS_UTILS.getStatusHealth(sampleItems, activeStatuses);
      console.log(`✅ Health: ${health.healthScore}% healthy`);

      console.log("Status operations working correctly!");
    } catch (error) {
      console.error("❌ Status operations test failed:", error.message);
    }

    console.log("=== END TEST ===\n");
  },
};

module.exports = DEBUG_UTILS;
