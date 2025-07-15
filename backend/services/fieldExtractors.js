// config/fieldExtractors.js - Organized field extractors for easier editing

// === FIELD EXTRACTOR CONFIGURATION ===

const FIELD_EXTRACTORS = {
  // === BASIC ITEM FIELDS ===

  item: {
    extractItemName: (item) => item.item_name || "cannot find item name",
    extractCategory: (item) =>
      item.department || "cannot find category/department",
    extractStatus: (item) => item.status || "cannot find status",
    extractBrand: (item) => item.brand || "cannot find brand",
  },

  // === PHYSICAL PROPERTIES ===

  physical: {
    extractColor: (item) =>
      item.color_value ||
      item.color_family ||
      item.brand_color ||
      "cannot find color",
    extractSize: (item) => item.size || item.size_details || "cannot find size",
    extractFit: (item) => item.fit || "cannot find fit information",
    extractComfort: (item) => item.comfort || "cannot find comfort rating",
    extractSilhouette: (item) => item.silhouette || "cannot find silhouette",
    extractHeelHeight: (item) => item.heel_height_inches || 0,
  },

  // === MATERIALS & CONSTRUCTION ===

  materials: {
    extractMaterial: (item) =>
      item.material_1 ||
      item.material_2 ||
      item.material_3 ||
      "cannot find material information",
    extractMaterial1: (item) => item.material_1 || "cannot find material 1",
    extractMaterial2: (item) => item.material_2 || "cannot find material 2",
    extractMaterial3: (item) => item.material_3 || "cannot find material 3",
    extractCountryOfFabrication: (item) =>
      item.country_of_fabrication || "cannot find country of fabrication",
    extractCareInstructions: (item) =>
      item.care_instructions || "cannot find care instructions",
  },

  // === PRICING & COSTS ===

  pricing: {
    extractPrice: (item) => item.purchase_price || item.original_price || 0,
    extractPurchasePrice: (item) => item.purchase_price || 0,
    extractOriginalPrice: (item) => item.original_price || 0,
    extractAlterationCost: (item) => item.alteration_cost || 0,
    extractMaintenanceCost: (item) => item.maintenance_cost || 0,
    extractSoldPrice: (item) => item.sold_price || 0,
  },

  // === ACQUISITION INFO ===

  acquisition: {
    extractSource: (item) =>
      item.item_source ||
      item.purchase_location ||
      item.purchase_channel ||
      "cannot find source/location",
    extractPurchaseLocation: (item) =>
      item.purchase_location || "cannot find purchase location",
    extractPurchaseChannel: (item) =>
      item.purchase_channel || "cannot find purchase channel",
    extractPurchaseDate: (item) => item.purchase_date || null,
    extractSeller: (item) => item.seller_username || "cannot find seller",
  },

  // === RATINGS & EVALUATIONS ===

  ratings: {
    extractRating: (item) =>
      item.swagger_rating || item.temp_rating || item.rain_rating || 0,
    extractSwaggerRating: (item) => item.swagger_rating || 0,
    extractTempRating: (item) => item.temp_rating || 0,
    extractRainRating: (item) => item.rain_rating || 0,
  },

  // === ORGANIZATION & CLASSIFICATION ===

  organization: {
    extractClosetSection: (item) =>
      item.closet_section || "cannot find closet section",
    extractCapsule: (item) => item.capsule || "cannot find capsule information",
    extractDivision: (item) => item.division || "cannot find division",
    extractPatternFamily: (item) =>
      item.pattern_family || "cannot find pattern family",
    extractAspectFamily: (item) =>
      item.aspect_family || "cannot find aspect family",
  },

  // === BOOLEAN STATUS FIELDS ===

  status: {
    extractIsSecondhand: (item) =>
      item.is_secondhand !== undefined
        ? item.is_secondhand
        : "cannot determine if secondhand",
    extractIsAltered: (item) =>
      item.is_altered !== undefined
        ? item.is_altered
        : "cannot determine if altered",
    extractIsLoggingComplete: (item) =>
      item.is_logging_complete !== undefined
        ? item.is_logging_complete
        : "cannot determine if logging complete",
  },

  // === MAINTENANCE & LIFECYCLE ===

  lifecycle: {
    extractTimesMaintained: (item) => item.times_maintained || 0,
    extractDateDiscarded: (item) => item.date_discarded || null,
    extractReason: (item) =>
      item.discard_reason ||
      item.outlet_sold_or_discarded ||
      "cannot find disposal reason",
  },

  // === GENERAL FIELDS ===

  general: {
    extractSeason: (item) => item.season || "cannot find season",
    extractNotes: (item) => item.notes || "cannot find notes",
    extractOccasion: (item) => item.occasion || "cannot find occasion",
    extractPriority: (item) => item.priority || "cannot find priority",
    extractDateWorn: (item) => item.date_worn || item.purchase_date || null,
  },

  // === OUTFIT-SPECIFIC FIELDS ===

  outfit: {
    extractGeneratorVersion: (outfit) =>
      outfit.generator_version || "cannot find generator version",
    extractGoodFor: (outfit) =>
      outfit.good_for || "cannot find what outfit is good for",
    extractItemIds: (outfit) =>
      outfit.item_ids || "cannot find item IDs in outfit",
    extractSelfies: (outfit) => outfit.selfies || "cannot find selfies",
    extractDatesWorn: (outfit) => outfit.dates_worn || "cannot find dates worn",
    extractCalendarIds: (outfit) =>
      outfit.calendar_ids || "cannot find calendar IDs",
    extractRecencyFactor: (outfit) => outfit.recency_factor || 0,
    extractAutoDate: (outfit) => outfit.auto_date || null,
    extractInspiration: (outfit) =>
      outfit.inspiration || "cannot find inspiration",
    extractRateTheRobot: (outfit) =>
      outfit.rate_the_robot || "cannot find robot rating",
  },

  // === OUTFIT STATUS FIELDS ===

  outfitStatus: {
    extractIsFinished: (outfit) =>
      outfit.is_finished !== undefined
        ? outfit.is_finished
        : "cannot determine if outfit is finished",
    extractAccepted: (outfit) =>
      outfit.accepted !== undefined
        ? outfit.accepted
        : "cannot determine if outfit was accepted",
    extractRejected: (outfit) =>
      outfit.rejected !== undefined
        ? outfit.rejected
        : "cannot determine if outfit was rejected",
  },

  // === UTILITY FUNCTIONS ===

  utils: {
    getSeason: (date) => {
      if (!date) return "cannot determine season from date";

      const seasons = {
        spring: [2, 3, 4], // March, April, May
        summer: [5, 6, 7], // June, July, August
        fall: [8, 9, 10], // September, October, November
        winter: [11, 0, 1], // December, January, February
      };

      const month = new Date(date).getMonth();
      for (const [season, months] of Object.entries(seasons)) {
        if (months.includes(month)) return season;
      }
      return "cannot determine season";
    },

    // Get all extractors as a flat object for backward compatibility
    getAllExtractors: () => {
      const flatExtractors = {};

      for (const [categoryName, categoryExtractors] of Object.entries(
        FIELD_EXTRACTORS
      )) {
        if (categoryName !== "utils") {
          Object.assign(flatExtractors, categoryExtractors);
        }
      }

      // Add utility functions directly
      Object.assign(flatExtractors, FIELD_EXTRACTORS.utils);

      return flatExtractors;
    },

    // Get extractors by category
    getByCategory: (categoryName) => {
      return FIELD_EXTRACTORS[categoryName] || {};
    },

    // Get all available categories
    getCategories: () => {
      return Object.keys(FIELD_EXTRACTORS).filter((key) => key !== "utils");
    },

    // Test an extractor function
    testExtractor: (extractorName, sampleData) => {
      const allExtractors = FIELD_EXTRACTORS.utils.getAllExtractors();
      const extractor = allExtractors[extractorName];

      if (!extractor) {
        console.error(`Extractor ${extractorName} not found`);
        return null;
      }

      console.log(`Testing ${extractorName}:`);
      console.log("Input:", JSON.stringify(sampleData, null, 2));

      const result = extractor(sampleData);

      console.log("Output:", result);
      return result;
    },

    // Get field coverage report
    analyzeFieldCoverage: (records, category = null) => {
      const extractors = category
        ? FIELD_EXTRACTORS[category]
        : FIELD_EXTRACTORS.utils.getAllExtractors();

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
  },
};

module.exports = FIELD_EXTRACTORS;
