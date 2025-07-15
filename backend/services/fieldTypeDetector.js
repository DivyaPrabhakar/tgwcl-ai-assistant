// services/fieldTypeDetector.js - Handles field type detection logic

class FieldTypeDetector {
  constructor() {
    this.fieldTypeRules = this.initializeFieldTypeRules();
  }

  initializeFieldTypeRules() {
    return {
      currency: {
        patterns: [
          "price",
          "cost",
          "_cost",
          "sold_price",
          "alteration_cost",
          "maintenance_cost",
        ],
        exactMatches: [],
      },

      date: {
        patterns: ["date", "_date"],
        exactMatches: ["auto_date"],
      },

      boolean: {
        patterns: ["is_"],
        exactMatches: ["accepted", "rejected", "is_finished"],
        suffixes: ["_complete"],
      },

      number: {
        patterns: [],
        exactMatches: [
          "swagger_rating",
          "rain_rating",
          "heel_height_inches",
          "times_maintained",
          "recency_factor",
          "material_1_pct",
          "material_2_pct",
          "material_3_pct",
          "days_since_worn_local_time",
        ],
      },

      text_lowercase: {
        patterns: ["color"],
        exactMatches: [
          "status",
          "department",
          "brand",
          "size",
          "fit",
          "comfort",
          "good_for",
          "rate_the_robot",
          "discard_reason",
          "outlet_sold_or_discarded",
          "silhouette",
          "pattern_family",
          "aspect_family",
          "country_of_fabrication",
          "closet_section",
          "division",
          "material_1",
          "material_2",
          "material_3",
          "seller_username",
          "purchase_location",
          "purchase_channel",
          "item_source",
          "grade",
          "occasion",
          "location_worn",
          "temp_rating",
        ],
      },

      text_preserve: {
        patterns: [],
        exactMatches: [
          "item_name",
          "notes",
          "care_instructions",
          "capsule",
          "inspiration",
          "item_ids",
          "calendar_ids",
          "selfies",
          "dates_worn",
          "linked_item_id",
          "inspiration_ids_using_item",
          "generator_version",
          "outfit_id",
          "selfie",
          "item_images",
          "outfit_metadata",
          "outfit_notes",
        ],
      },
    };
  }

  /**
   * Detect field type based on field name
   * @param {string} fieldName - Field name to analyze
   * @returns {string} - Detected field type
   */
  detectFieldType(fieldName) {
    const lowerFieldName = fieldName.toLowerCase();

    // Check each field type in order of priority
    for (const [fieldType, rules] of Object.entries(this.fieldTypeRules)) {
      if (this.matchesFieldType(lowerFieldName, rules)) {
        return fieldType;
      }
    }

    // Default to preserve case text for unknown fields
    return "text_preserve";
  }

  /**
   * Check if a field name matches the rules for a specific type
   * @param {string} fieldName - Field name to check
   * @param {Object} rules - Rules for the field type
   * @returns {boolean} - Whether the field matches
   */
  matchesFieldType(fieldName, rules) {
    // Check exact matches first
    if (rules.exactMatches && rules.exactMatches.includes(fieldName)) {
      return true;
    }

    // Check pattern matches
    if (
      rules.patterns &&
      rules.patterns.some((pattern) => fieldName.includes(pattern))
    ) {
      return true;
    }

    // Check suffix matches
    if (
      rules.suffixes &&
      rules.suffixes.some((suffix) => fieldName.endsWith(suffix))
    ) {
      return true;
    }

    // Check prefix matches (for patterns like 'is_')
    if (
      rules.patterns &&
      rules.patterns.some(
        (pattern) => pattern.endsWith("_") && fieldName.startsWith(pattern)
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Add a new field type rule
   * @param {string} fieldName - Field name to add
   * @param {string} fieldType - Type to assign to the field
   */
  addFieldRule(fieldName, fieldType) {
    if (!this.fieldTypeRules[fieldType]) {
      console.warn(`Unknown field type: ${fieldType}`);
      return;
    }

    if (!this.fieldTypeRules[fieldType].exactMatches.includes(fieldName)) {
      this.fieldTypeRules[fieldType].exactMatches.push(fieldName);
      console.log(`Added ${fieldName} as ${fieldType} field`);
    }
  }

  /**
   * Get all fields of a specific type
   * @param {string} fieldType - Type to get fields for
   * @returns {Object} - Rules for the field type
   */
  getFieldsOfType(fieldType) {
    return this.fieldTypeRules[fieldType] || {};
  }

  /**
   * Debug field type detection for a set of field names
   * @param {Array} fieldNames - Field names to analyze
   */
  debugFieldTypes(fieldNames) {
    console.log("\n=== FIELD TYPE DETECTION DEBUG ===");

    const typeGroups = {};

    fieldNames.forEach((fieldName) => {
      const detectedType = this.detectFieldType(fieldName);

      if (!typeGroups[detectedType]) {
        typeGroups[detectedType] = [];
      }
      typeGroups[detectedType].push(fieldName);
    });

    // Display results grouped by type
    Object.entries(typeGroups).forEach(([type, fields]) => {
      console.log(`\n${type.toUpperCase()}:`);
      fields.forEach((field) => console.log(`  - ${field}`));
    });

    console.log("\n=== END DEBUG ===\n");
    return typeGroups;
  }

  /**
   * Get field type statistics for a record
   * @param {Object} record - Record to analyze
   * @returns {Object} - Type distribution statistics
   */
  analyzeRecord(record) {
    const typeStats = {};

    Object.keys(record).forEach((fieldName) => {
      if (fieldName === "id") return;

      const type = this.detectFieldType(fieldName);
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    return typeStats;
  }
}

module.exports = FieldTypeDetector;
