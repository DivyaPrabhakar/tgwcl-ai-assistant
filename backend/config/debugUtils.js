// config/debugUtils.js - Debug and testing utilities

const DEBUG_UTILS = {
  /**
   * Test field extractors on sample data
   * @param {Object} sampleItem - Sample item to test
   * @param {Object} extractors - Field extractors to test
   * @param {string} category - Category name (optional)
   */
  testFieldExtractors: (sampleItem, extractors, category = null) => {
    console.log("\n=== FIELD EXTRACTOR TEST ===");
    console.log("Sample item:", JSON.stringify(sampleItem, null, 2));

    if (category) {
      console.log(`Testing category: ${category}`);
    }

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
   * @param {Object} extractors - Field extractors
   * @param {string} recordType - Type of records (for logging)
   */
  analyzeDataQuality: (records, extractors, recordType = "items") => {
    if (!Array.isArray(records) || records.length === 0) {
      console.warn("No records provided for data quality analysis");
      return {};
    }

    console.log(
      `\n=== DATA QUALITY ANALYSIS (${recordType.toUpperCase()}) ===`
    );
    console.log(`Total records: ${records.length}`);

    // Get coverage report
    const coverage = DEBUG_UTILS.analyzeFieldCoverage(records, extractors);

    // Sort by coverage percentage
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
   * Analyze field coverage for extractors
   * @param {Array} records - Records to analyze
   * @param {Object} extractors - Field extractors
   * @returns {Object} - Coverage statistics
   */
  analyzeFieldCoverage: (records, extractors) => {
    const coverage = {};

    for (const [extractorName, extractorFunc] of Object.entries(extractors)) {
      if (typeof extractorFunc !== "function") continue;

      const results = records.map((record) => extractorFunc(record));
      const missingCount = results.filter(
        (result) => typeof result === "string" && result.startsWith("cannot")
      ).length;

      coverage[extractorName] = {
        total: records.length,
        missing: missingCount,
        found: records.length - missingCount,
        percentage: Math.round(
          ((records.length - missingCount) / records.length) * 100
        ),
      };
    }

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
   * Get configuration summary for debugging
   * @param {Object} wardrobeConfig - Wardrobe configuration
   * @returns {Object} - Configuration summary
   */
  getConfigSummary: (wardrobeConfig) => {
    return {
      app: wardrobeConfig.APP,
      targetActiveStatuses: wardrobeConfig.TARGET_ACTIVE_STATUSES,
      cacheConfig: wardrobeConfig.CACHE,
      uiConfig: wardrobeConfig.UI,
      analyticsConfig: wardrobeConfig.ANALYTICS,
      validationRules: wardrobeConfig.VALIDATION,
    };
  },

  /**
   * Test status operations with sample data
   * @param {Array} sampleItems - Sample items
   * @param {Object} statusUtils - Status utilities
   * @param {Array} activeStatuses - Active statuses
   */
  testStatusOperations: (sampleItems, statusUtils, activeStatuses) => {
    console.log("\n=== STATUS OPERATIONS TEST ===");

    try {
      // Test categorization
      const categorized = statusUtils.categorizeByStatus(
        sampleItems,
        activeStatuses
      );
      console.log(
        `✅ Categorization: ${categorized.active.length} active, ${categorized.inactive.length} inactive`
      );

      // Test breakdown
      const breakdown = statusUtils.getStatusBreakdown(sampleItems);
      console.log(
        `✅ Breakdown: ${Object.keys(breakdown).length} unique statuses`
      );

      // Test health metrics
      const health = statusUtils.getStatusHealth(sampleItems, activeStatuses);
      console.log(`✅ Health: ${health.healthScore}% healthy`);

      console.log("Status operations working correctly!");
    } catch (error) {
      console.error("❌ Status operations test failed:", error.message);
    }

    console.log("=== END TEST ===\n");
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
};

module.exports = DEBUG_UTILS;
