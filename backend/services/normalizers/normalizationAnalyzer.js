// services/normalizers/normalizationAnalyzer.js - Analysis and debugging utilities

class NormalizationAnalyzer {
  constructor(typeNormalizers) {
    this.typeNormalizers = typeNormalizers;
  }

  /**
   * Get normalization statistics for a set of values
   * @param {Array} values - Values to analyze
   * @param {string} fieldType - Field type for normalization
   * @returns {Object} - Statistics about the normalization
   */
  analyzeNormalization(values, fieldType) {
    const stats = {
      total: values.length,
      changed: 0,
      errors: 0,
      nullValues: 0,
      examples: [],
    };

    values.forEach((value, index) => {
      if (value === null || value === undefined) {
        stats.nullValues++;
        return;
      }

      try {
        const normalized = this.normalizeValueByType(value, fieldType);

        if (value !== normalized) {
          stats.changed++;

          if (stats.examples.length < 3) {
            stats.examples.push({
              original: value,
              normalized: normalized,
              type: typeof value,
            });
          }
        }
      } catch (error) {
        stats.errors++;
      }
    });

    return stats;
  }

  /**
   * Helper method to normalize by type (delegates to typeNormalizers)
   */
  normalizeValueByType(value, fieldType) {
    switch (fieldType) {
      case "currency":
        return this.typeNormalizers.normalizeCurrency(value);
      case "date":
        return this.typeNormalizers.normalizeDate(value);
      case "boolean":
        return this.typeNormalizers.normalizeBoolean(value);
      case "number":
        return this.typeNormalizers.normalizeNumber(value);
      case "text_lowercase":
        return this.typeNormalizers.normalizeText(value, true);
      case "text_preserve":
        return this.typeNormalizers.normalizeText(value, false);
      default:
        return this.typeNormalizers.normalizeText(value, false);
    }
  }

  /**
   * Analyze multiple fields at once
   * @param {Object} sampleData - Object with field names as keys, arrays of values as values
   * @param {Object} fieldTypes - Object with field names as keys, field types as values
   * @returns {Object} - Analysis results per field
   */
  analyzeMultipleFields(sampleData, fieldTypes) {
    const results = {};

    Object.entries(sampleData).forEach(([fieldName, values]) => {
      const fieldType = fieldTypes[fieldName] || "text_preserve";
      results[fieldName] = this.analyzeNormalization(values, fieldType);
    });

    return results;
  }

  /**
   * Generate a summary report of normalization analysis
   * @param {Object} analysisResults - Results from analyzeMultipleFields
   * @returns {Object} - Summary report
   */
  generateSummaryReport(analysisResults) {
    const summary = {
      totalFields: Object.keys(analysisResults).length,
      fieldsWithChanges: 0,
      fieldsWithErrors: 0,
      totalValuesProcessed: 0,
      totalChanges: 0,
      totalErrors: 0,
      fieldDetails: {},
    };

    Object.entries(analysisResults).forEach(([fieldName, stats]) => {
      summary.totalValuesProcessed += stats.total;
      summary.totalChanges += stats.changed;
      summary.totalErrors += stats.errors;

      if (stats.changed > 0) {
        summary.fieldsWithChanges++;
      }

      if (stats.errors > 0) {
        summary.fieldsWithErrors++;
      }

      summary.fieldDetails[fieldName] = {
        changeRate:
          stats.total > 0 ? Math.round((stats.changed / stats.total) * 100) : 0,
        errorRate:
          stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0,
        nullRate:
          stats.total > 0
            ? Math.round((stats.nullValues / stats.total) * 100)
            : 0,
      };
    });

    return summary;
  }

  /**
   * Debug a single value normalization
   * @param {*} value - Value to test
   * @param {string} fieldType - Field type
   * @param {string} fieldName - Field name for context
   */
  debugSingleValue(value, fieldType, fieldName = "unknown") {
    console.log(`\n=== NORMALIZATION DEBUG: ${fieldName} ===`);
    console.log(`Input: ${JSON.stringify(value)} (${typeof value})`);
    console.log(`Field Type: ${fieldType}`);

    try {
      const normalized = this.normalizeValueByType(value, fieldType);
      console.log(
        `Output: ${JSON.stringify(normalized)} (${typeof normalized})`
      );
      console.log(`Changed: ${value !== normalized ? "Yes" : "No"}`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }

    console.log("=== END DEBUG ===\n");
  }

  /**
   * Test normalization on sample data
   * @param {Array} sampleRecords - Records to test
   * @param {Object} fieldTypes - Field type mappings
   */
  testNormalization(sampleRecords, fieldTypes) {
    console.log("\n=== NORMALIZATION TEST ===");
    console.log(`Testing ${sampleRecords.length} records...`);

    // Extract field data
    const fieldData = {};
    Object.keys(fieldTypes).forEach((fieldName) => {
      fieldData[fieldName] = sampleRecords
        .map((record) => record[fieldName])
        .filter((val) => val !== undefined);
    });

    // Analyze
    const results = this.analyzeMultipleFields(fieldData, fieldTypes);
    const summary = this.generateSummaryReport(results);

    // Report
    console.log(`\nResults:`);
    console.log(`  Fields analyzed: ${summary.totalFields}`);
    console.log(`  Values processed: ${summary.totalValuesProcessed}`);
    console.log(`  Changes made: ${summary.totalChanges}`);
    console.log(`  Errors: ${summary.totalErrors}`);

    console.log(`\nField Details:`);
    Object.entries(summary.fieldDetails).forEach(([fieldName, details]) => {
      const status =
        details.errorRate > 0 ? "❌" : details.changeRate > 0 ? "⚠️" : "✅";
      console.log(
        `  ${status} ${fieldName}: ${details.changeRate}% changed, ${details.errorRate}% errors`
      );
    });

    console.log("=== END TEST ===\n");
    return { results, summary };
  }
}

module.exports = NormalizationAnalyzer;
