// services/normalizers/valueNormalizer.js - Clean version

const TypeNormalizers = require("./typeNormalizer");

class ValueNormalizers {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.typeNormalizers = new TypeNormalizers(debugMode);
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
        if (this.debugMode) {
          this.log(
            `Unknown field type '${fieldType}' for ${fieldName}, treating as preserve-case text`
          );
        }
        return this.typeNormalizers.normalizeText(value, false);
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.typeNormalizers.setDebugMode(enabled);
  }

  /**
   * Get type normalizers for advanced usage
   */
  getTypeNormalizers() {
    return this.typeNormalizers;
  }

  // === LOGGING ===

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
