// services/normalizers/typeNormalizers.js - Core data type normalization logic

class TypeNormalizers {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  /**
   * Normalize currency values
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
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // === LOGGING ===

  log(message) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`[${timestamp}] TypeNormalizers: ${message}`);
    }
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] TypeNormalizers ERROR: ${message}`);
    if (error) {
      console.error("  Error details:", error);
    }
  }
}

module.exports = TypeNormalizers;
