// config/config.js - Centralized configuration
require("dotenv").config();

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Airtable configuration
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    closetBaseId: process.env.AIRTABLE_CLOSET_BASE_ID,
    referencesBaseId: process.env.AIRTABLE_REFERENCES_BASE_ID,
    finishedBaseId: process.env.AIRTABLE_FINISHED_BASE_ID,
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  // Cache configuration
  cache: {
    expiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    dataDir: "cached_data",
  },

  // Validation
  isValid() {
    const missing = [];

    if (!this.airtable.apiKey) missing.push("AIRTABLE_API_KEY");
    if (!this.airtable.closetBaseId) missing.push("AIRTABLE_CLOSET_BASE_ID");
    if (!this.airtable.referencesBaseId)
      missing.push("AIRTABLE_REFERENCES_BASE_ID");
    if (!this.airtable.finishedBaseId)
      missing.push("AIRTABLE_FINISHED_BASE_ID");
    if (!this.openai.apiKey) missing.push("OPENAI_API_KEY");

    if (missing.length > 0) {
      console.warn("Missing environment variables:", missing);
      return false;
    }
    return true;
  },

  // Log configuration status
  logStatus() {
    console.log("📋 Environment check:");
    console.log("- NODE_ENV:", this.nodeEnv);
    console.log("- PORT:", this.port);
    console.log(
      "- AIRTABLE_API_KEY:",
      this.airtable.apiKey ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "- AIRTABLE_CLOSET_BASE_ID:",
      this.airtable.closetBaseId ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "- AIRTABLE_REFERENCES_BASE_ID:",
      this.airtable.referencesBaseId ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "- AIRTABLE_FINISHED_BASE_ID:",
      this.airtable.finishedBaseId ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "- OPENAI_API_KEY:",
      this.openai.apiKey ? "✅ Set" : "❌ Missing"
    );
  },
};

module.exports = config;
