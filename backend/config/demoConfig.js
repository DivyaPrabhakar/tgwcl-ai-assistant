// config/demoConfig.js - Demo mode configuration
const DEMO_CONFIG = {
  // Enable demo mode for public deployment
  DEMO_MODE: process.env.DEMO_MODE === "true",

  // Features available in demo mode
  DEMO_FEATURES: {
    viewDashboard: true,
    viewAnalytics: true,
    viewData: true,
    chatInterface: true, // Show interface but disable functionality
    chatHistory: true, // Show sample chat history
    useChat: false, // Disable actual chat
    modifyData: false, // Disable any data modifications
  },

  // Sample chat messages for demo
  SAMPLE_CHAT_HISTORY: [
    {
      type: "user",
      content: "How many items do I have in my wardrobe?",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      type: "assistant",
      content:
        "Based on your wardrobe data, you currently have 342 active items across all categories. Your collection breaks down as: 89 tops, 45 bottoms, 67 shoes, 52 accessories, and 89 other items. Your most worn category is tops, with an average of 12 wears per item this year.",
      timestamp: new Date(Date.now() - 86400000 + 30000).toISOString(),
    },
    {
      type: "user",
      content: "What are my most expensive items that I rarely wear?",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      type: "assistant",
      content:
        "Looking at your cost-per-wear analysis, here are your highest-cost, low-usage items: 1) Designer blazer ($450, worn only 2 times - $225/wear), 2) Evening gown ($380, worn 1 time - $380/wear), 3) Leather boots ($320, worn 3 times - $107/wear). Consider occasions where you could incorporate these pieces more frequently to improve their value.",
      timestamp: new Date(Date.now() - 3600000 + 45000).toISOString(),
    },
  ],

  // Demo user info
  DEMO_USER: {
    name: "Wardrobe AI Demo",
    description:
      "This is a demonstration of the Wardrobe AI assistant showcasing real wardrobe data and analytics.",
    features: [
      "Real-time wardrobe analytics",
      "Cost-per-wear analysis",
      "Usage pattern insights",
      "Multi-database integration",
      "AI-powered wardrobe insights",
    ],
  },
};

module.exports = DEMO_CONFIG;
