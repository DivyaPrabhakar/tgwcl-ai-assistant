// services/valueNormalizers.js - Handles value normalization by type

class ValueNormalizers {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  /**
   * Normalize currency values
   * @param {*} value - Value to normalize
   * @returns {number} - Normalized currency value
   */
  normalizeCurrency(value) {
    try {
      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        const cleaned = value.replace(/[$,£€¥]/g, "").trim();
        const number = parseFloat(cleaned);

        if (isNaN(number)) {
          this.log(`Cannot parse currency value: "${value}"`);
          return 0;
        }

        return number;
      }

      this.log(`Unexpected currency value type: ${typeof value} - ${value}`);
      return 0;
    } catch (error) {
      this.logError("Currency normalization error:", error);
      return 0;
    }
  }

  /**
   * Normalize text values with case control
   * @param {*} value - Value to normalize
   * @param {boolean} lowercase - Whether to convert to lowercase
   * @returns {string} - Normalized text value
   */
  normalizeText(value, lowercase = true) {
    try {
      if (typeof value !== "string") {
        const stringValue = String(value || "");
        this.log(`Converting ${typeof value} to string: "${stringValue}"`);
        return stringValue;
      }

      const trimmed = value.trim();
      const result = lowercase ? trimmed.toLowerCase() : trimmed;

      if (this.debugMode && value !== result) {
        this.log(`Text normalized: "${value}" → "${result}"`);
      }

      return result;
    } catch (error) {
      this.logError("Text normalization error:", error);
      return String(value || "");
    }
  }

  /**
   * Normalize number values
   * @param {*} value - Value to normalize
   * @returns {number} - Normalized number value
   */
  normalizeNumber(value) {
    try {
      if (typeof value === "number") {
        return value;
      }

      const number = parseFloat(value);

      if (isNaN(number)) {
        this.log(
          `Skipping non-numeric value for number field: "${value}" (treating as 0)`
        );
        return 0;
      }

      return number;
    } catch (error) {
      this.logError("Number normalization error:", error);
      return 0;
    }
  }

  /**
   * Normalize date values
   * @param {*} value - Value to normalize
   * @returns {string|null} - Normalized date value (ISO string) or null
   */
  normalizeDate(value) {
    try {
      if (!value) return null;

      // Already a Date object
      if (value instanceof Date) {
        return value.toISOString();
      }

      // String date
      if (typeof value === "string") {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          this.log(`Cannot parse date value: "${value}"`);
          return null;
        }

        return date.toISOString();
      }

      this.log(`Unexpected date value type: ${typeof value} - ${value}`);
      return null;
    } catch (error) {
      this.logError("Date normalization error:", error);
      return null;
    }
  }

  /**
   * Normalize boolean values
   * @param {*} value - Value to normalize
   * @returns {boolean} - Normalized boolean value
   */
  normalizeBoolean(value) {
    try {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const lower = value.toLowerCase().trim();
        const result = lower === "true" || lower === "yes" || lower === "1";
        this.log(`Boolean parsed: "${value}" → ${result}`);
        return result;
      }

      if (typeof value === "number") {
        const result = value !== 0;
        this.log(`Number to boolean: ${value} → ${result}`);
        return result;
      }

      const result = !!value;
      this.log(`Generic boolean conversion: ${value} → ${result}`);
      return result;
    } catch (error) {
      this.logError("Boolean normalization error:", error);
      return !!value;
    }
  }

  /**
   * Normalize value based on detected type
   * @param {*} value - Value to normalize
   * @param {string} fieldType - Detected field type
   * @param {string} fieldName - Original field name (for logging)
   * @returns {*} - Normalized value
   */
  normalizeByType(value, fieldType, fieldName = "") {
    if (value === null || value === undefined) {
      return null;
    }

    switch (fieldType) {
      case "currency":
        return this.normalizeCurrency(value);
      case "date":
        return this.normalizeDate(value);
      case "boolean":
        return this.normalizeBoolean(value);
      case "number":
        return this.normalizeNumber(value);
      case "text_lowercase":
        return this.normalizeText(value, true);
      case "text_preserve":
        return this.normalizeText(value, false);
      default:
        if (this.debugMode) {
          this.log(
            `Unknown field type '${fieldType}' for ${fieldName}, treating as preserve-case text`
          );
        }
        return this.normalizeText(value, false);
    }
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
        const normalized = this.normalizeByType(value, fieldType);

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
   * Set debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // === LOGGING HELPERS ===

  log(message) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`[${timestamp}] ValueNormalizers: ${message}`);
    }
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] ValueNormalizers ERROR: ${message}`);
    if (error) {
      console.error("  Error details:", error);
    }
  }
}

module.exports = ValueNormalizers;
