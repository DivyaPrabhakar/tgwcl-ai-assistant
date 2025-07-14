// config/constants.js - Centralized configuration for wardrobe logic
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

  // Field mappings for different Airtable naming conventions
  FIELD_MAPPINGS: {
    ITEM_NAME: ["Name", "name", "Item Name", "item_name"],
    CATEGORY: ["Category", "category", "Department", "department"],
    STATUS: ["Status", "status", "State", "state"],
    COST: ["Cost", "cost", "Price", "price", "Cost ($)", "Price ($)"],
    BRAND: ["Brand", "brand", "Manufacturer", "manufacturer"],
    COLOR: ["Color", "color", "Colour", "colour"],
    SEASON: ["Season", "season"],
    SIZE: ["Size", "size"],
    DATE_WORN: ["date_worn", "Date", "Date Worn", "Worn Date"],
    OCCASION: ["occasion", "Occasion", "Event", "event"],
    RATING: ["Rating", "rating", "Score", "score"],
  },

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

// Helper functions for field extraction
const FIELD_EXTRACTORS = {
  getFieldValue: (item, fieldType) => {
    const possibleFields = WARDROBE_CONFIG.FIELD_MAPPINGS[fieldType];
    for (const field of possibleFields) {
      if (item[field] !== undefined && item[field] !== null) {
        return item[field];
      }
    }
    return null;
  },

  extractPrice: (item) => {
    const priceValue = FIELD_EXTRACTORS.getFieldValue(item, "COST");
    if (!priceValue) return 0;

    const numericValue =
      typeof priceValue === "string"
        ? parseFloat(priceValue.replace(/[$,]/g, ""))
        : priceValue;

    return !isNaN(numericValue) && numericValue > 0 ? numericValue : 0;
  },

  extractItemName: (item) => {
    return FIELD_EXTRACTORS.getFieldValue(item, "ITEM_NAME") || "";
  },

  extractCategory: (item) => {
    return FIELD_EXTRACTORS.getFieldValue(item, "CATEGORY") || "Uncategorized";
  },

  extractStatus: (item) => {
    return FIELD_EXTRACTORS.getFieldValue(item, "STATUS") || "unknown";
  },

  getSeason: (date) => {
    const month = new Date(date).getMonth();
    for (const [season, months] of Object.entries(
      WARDROBE_CONFIG.ANALYTICS.SEASONS
    )) {
      if (months.includes(month)) return season;
    }
    return "unknown";
  },
};

// Fuzzy matching utility for status detection
const STATUS_MATCHER = {
  // Calculate similarity between two strings (0-1, 1 = exact match)
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

  // Find the best match for a status from target list
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

  // Determine active statuses from actual Airtable data
  determineActiveStatuses: (allActualStatuses) => {
    const activeMatches = [];
    const targetStatuses = WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES;

    console.log("🔍 Matching actual statuses to target active statuses...");
    console.log("📝 Actual statuses from Airtable:", allActualStatuses);
    console.log("🎯 Target active statuses:", targetStatuses);

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
          `✅ Matched "${actualStatus}" to "${
            match.target
          }" (score: ${match.score.toFixed(2)})`
        );
      } else {
        console.log(`❌ No match found for "${actualStatus}"`);
      }
    }

    const activeStatuses = activeMatches.map((m) => m.actual);
    console.log("🎯 Final active statuses:", activeStatuses);

    return {
      activeStatuses,
      matches: activeMatches,
      unmatchedStatuses: allActualStatuses.filter(
        (s) => !activeStatuses.includes(s)
      ),
    };
  },
};

// Status utility functions
const STATUS_UTILS = {
  isActive: (status, activeStatuses) => {
    return activeStatuses.includes(status?.toLowerCase?.() || status);
  },

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

  categorizeByStatus: (items, activeStatuses) => {
    return items.reduce(
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
  },
};

module.exports = {
  WARDROBE_CONFIG,
  FIELD_EXTRACTORS,
  STATUS_MATCHER,
  STATUS_UTILS,
};
