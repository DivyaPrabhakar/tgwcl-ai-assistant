// config/api.js - API configuration helper
export const API_CONFIG = {
  // Default ports and URLs
  DEVELOPMENT: {
    BACKEND_PORT: 3001,
    FRONTEND_PORT: 3000,
    BASE_URL: "http://localhost:3001",
  },

  // API endpoints
  ENDPOINTS: {
    HEALTH: "/api/health",
    ANALYTICS: "/api/wardrobe/analytics",
    COST_ANALYSIS: "/api/wardrobe/cost-analysis",
    ACTIVE_ITEMS: "/api/wardrobe/active-items",
    STATUSES: "/api/wardrobe/statuses",
    ITEMS_BY_STATUS: "/api/wardrobe/items-by-status",
    CHAT: "/api/chat",
  },

  // Get the correct API base URL based on environment
  getBaseUrl: () => {
    // Check for environment variable first
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }

    // Development mode
    if (process.env.NODE_ENV === "development") {
      return API_CONFIG.DEVELOPMENT.BASE_URL;
    }

    // Production mode - assume API is on same domain
    return "";
  },

  // Build full endpoint URL
  buildUrl: (endpoint) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    return `${baseUrl}${endpoint}`;
  },

  // Check if we're likely in a development environment
  isDevelopment: () => {
    return (
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  },
};

// Diagnostic function to help debug API issues
export const diagnosAPI = async () => {
  const baseUrl = API_CONFIG.getBaseUrl();
  const healthUrl = API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.HEALTH);


  try {
    const response = await fetch(healthUrl);

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(
        "❌ Health Check Failed. Response body:",
        text.substring(0, 200)
      );
      return {
        success: false,
        error: `HTTP ${response.status}: ${text.substring(0, 100)}`,
      };
    }
  } catch (error) {
    console.log("❌ Health Check Error:", error.message);
    return { success: false, error: error.message };
  }
};

export default API_CONFIG;
