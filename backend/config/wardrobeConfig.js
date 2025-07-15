// config/wardrobeConfig.js - Updated to match your EXACT Airtable filter

const WARDROBE_CONFIG = {
  // Updated to match your exact Airtable active filter
  TARGET_ACTIVE_STATUSES: [
    "active", // Matches "Active"
    "ready to sell", // Matches "Ready_To_Sell"
    "lent", // Matches "Lent"
    "in laundry", // Matches "In_Laundry"
    "at cleaners", // Matches "At_Cleaners"
    "needs repair", // Matches "Needs_Repair"
  ],

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

  // Validation rules
  VALIDATION: {
    MIN_ITEM_NAME_LENGTH: 1,
    MAX_ITEM_NAME_LENGTH: 100,
    MIN_COST: 0,
    MAX_COST: 10000,
    REQUIRED_FIELDS: ["item_name", "status"],
  },

  // Application settings
  APP: {
    VERSION: "4.0.0",
    NAME: "Wardrobe AI",
    DESCRIPTION: "Personal wardrobe AI assistant",
    FIELD_NORMALIZATION_ENABLED: true,
  },
};

module.exports = WARDROBE_CONFIG;
