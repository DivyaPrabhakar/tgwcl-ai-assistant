// services/normalizers/fieldNormalizer.js - Fixed import paths for subdirectory

const FieldTypeDetector = require("../fieldTypeDetector"); // Go up one directory
const ValueNormalizer = require("./valueNormalizer"); // Same directory

class FieldNormalizer {
  constructor() {
    this.debugMode = process.env.NODE_ENV === "development";
    this.typeDetector = new FieldTypeDetector();
    this.valueNormalizers = new ValueNormalizer(this.debugMode);

    this.log("Field Normalizer initialized");
  }

  // === MAIN NORMALIZATION METHODS ===

  /**
   * Normalize a single Airtable record
   * @param {Object} record - Raw Airtable record
   * @returns {Object} - Normalized record
   */
  normalizeRecord(record) {
    if (!record || typeof record !== "object") {
      this.logError("Invalid record passed to normalizeRecord:", record);
      return { id: null };
    }

    const normalized = { id: record.id };
    let normalizedFieldCount = 0;

    // Process each field in the record
    for (const [fieldName, fieldValue] of Object.entries(record)) {
      if (fieldName !== "id") {
        try {
          normalized[fieldName] = this.normalizeField(fieldName, fieldValue);
          normalizedFieldCount++;
        } catch (error) {
          this.logError(`Error normalizing field ${fieldName}:`, error);
          normalized[fieldName] = fieldValue; // Keep original on error
        }
      }
    }

    this.log(
      `Normalized record ${record.id}: ${normalizedFieldCount} fields processed`
    );
    return normalized;
  }

  /**
   * Normalize an array of records with progress tracking
   * @param {Array} records - Array of raw Airtable records
   * @returns {Array} - Array of normalized records
   */
  normalizeRecords(records) {
    if (!Array.isArray(records)) {
      this.logError(
        "Invalid records array passed to normalizeRecords:",
        records
      );
      return [];
    }

    this.log(`Starting normalization of ${records.length} records`);
    const startTime = Date.now();

    const normalized = records.map((record, index) => {
      if (index % 100 === 0 && index > 0) {
        this.log(`Progress: ${index}/${records.length} records normalized`);
      }
      return this.normalizeRecord(record);
    });

    const duration = Date.now() - startTime;
    this.log(
      `Completed normalization: ${normalized.length} records in ${duration}ms`
    );

    return normalized;
  }

  /**
   * Normalize a single field value
   * @param {string} fieldName - Field name
   * @param {*} fieldValue - Field value
   * @returns {*} - Normalized value
   */
  normalizeField(fieldName, fieldValue) {
    const fieldType = this.typeDetector.detectFieldType(fieldName);

    // Only log for debugging if there are issues
    const shouldLog =
      this.debugMode && (fieldType === "unknown" || fieldType === "currency");

    if (shouldLog) {
      this.log(
        `Normalizing ${fieldName} (type: ${fieldType}): ${JSON.stringify(
          fieldValue
        )}`
      );
    }

    return this.valueNormalizers.normalizeByType(
      fieldValue,
      fieldType,
      fieldName
    );
  }

  // === UTILITY METHODS ===

  /**
   * Get field statistics for debugging
   * @param {Array} normalizedRecords - Normalized records to analyze
   * @returns {Object} - Field statistics
   */
  getFieldStats(normalizedRecords) {
    if (!Array.isArray(normalizedRecords) || normalizedRecords.length === 0) {
      return { error: "No records provided for stats" };
    }

    const stats = {
      totalRecords: normalizedRecords.length,
      uniqueStatuses: this.getUniqueValues(normalizedRecords, "status"),
      uniqueCategories: this.getUniqueValues(normalizedRecords, "department"),
      uniqueBrands: this.getUniqueValues(normalizedRecords, "brand"),
      recordsWithCost: normalizedRecords.filter(
        (r) => (r.purchase_price || r.original_price || 0) > 0
      ).length,
      averageCost: this.calculateAverageCost(normalizedRecords),
      totalCost: this.calculateTotalCost(normalizedRecords),
      fieldCoverage: this.analyzeFieldCoverage(normalizedRecords),
    };

    this.log("Field statistics calculated:", stats);
    return stats;
  }

  getUniqueValues(records, fieldName) {
    const values = records
      .map((record) => record[fieldName])
      .filter((value) => value !== null && value !== undefined && value !== "");

    return [...new Set(values)].sort();
  }

  calculateAverageCost(records) {
    const costs = records
      .map((r) => r.purchase_price || r.original_price || 0)
      .filter((cost) => cost > 0);

    return costs.length > 0
      ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length
      : 0;
  }

  calculateTotalCost(records) {
    return records
      .map((r) => r.purchase_price || r.original_price || 0)
      .reduce((sum, cost) => sum + cost, 0);
  }

  analyzeFieldCoverage(records) {
    if (records.length === 0) return {};

    const firstRecord = records[0];
    const coverage = {};

    for (const fieldName of Object.keys(firstRecord)) {
      if (fieldName === "id") continue;

      const nonEmptyCount = records.filter((record) => {
        const value = record[fieldName];
        return value !== null && value !== undefined && value !== "";
      }).length;

      coverage[fieldName] = {
        count: nonEmptyCount,
        percentage: Math.round((nonEmptyCount / records.length) * 100),
        missing: records.length - nonEmptyCount,
      };
    }

    return coverage;
  }

  // === DEBUG METHODS ===

  /**
   * Test field normalization on a sample record
   * @param {Object} sampleRecord - Record to test
   * @returns {Object} - Normalized record
   */
  testNormalization(sampleRecord) {
    console.log("\n=== FIELD NORMALIZATION TEST ===");
    console.log("Input record:", JSON.stringify(sampleRecord, null, 2));

    const normalized = this.normalizeRecord(sampleRecord);

    console.log("Normalized record:", JSON.stringify(normalized, null, 2));
    console.log("=== END TEST ===\n");

    return normalized;
  }

  /**
   * Debug field type detection
   * @param {Object} sampleRecord - Record to analyze
   */
  debugFieldTypes(sampleRecord) {
    console.log("\n=== FIELD TYPE DETECTION DEBUG ===");

    for (const [fieldName, fieldValue] of Object.entries(sampleRecord)) {
      if (fieldName === "id") continue;

      const detectedType = this.typeDetector.detectFieldType(fieldName);
      const valueType = typeof fieldValue;
      const valuePreview = JSON.stringify(fieldValue).substring(0, 50);

      console.log(`${fieldName}:`);
      console.log(`  Detected Type: ${detectedType}`);
      console.log(`  Value Type: ${valueType}`);
      console.log(`  Value: ${valuePreview}`);
      console.log("");
    }

    console.log("=== END DEBUG ===\n");
  }

  /**
   * Set debug mode for all components
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.valueNormalizers.setDebugMode(enabled);
    this.log(`Debug mode ${enabled ? "enabled" : "disabled"}`);
  }

  // === COMPONENT ACCESS ===

  /**
   * Get the type detector for advanced usage
   * @returns {FieldTypeDetector} - Type detector instance
   */
  getTypeDetector() {
    return this.typeDetector;
  }

  /**
   * Get the value normalizers for advanced usage
   * @returns {ValueNormalizers} - Value normalizers instance
   */
  getValueNormalizers() {
    return this.valueNormalizers;
  }

  // === LOGGING HELPERS ===

  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`[${timestamp}] FieldNormalizer: ${message}`);
      if (data) {
        console.log("  Data:", data);
      }
    }
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] FieldNormalizer ERROR: ${message}`);
    if (error) {
      console.error("  Error details:", error);
    }
  }
}

module.exports = FieldNormalizer;
