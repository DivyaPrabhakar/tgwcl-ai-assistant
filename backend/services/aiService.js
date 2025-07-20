// services/aiService.js - OpenAI integration for chat responses
const OpenAI = require("openai");

class AIService {
  constructor() {
    // Get config after requiring to avoid circular dependencies
    const config = require("../config/config");

    if (config.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
    } else {
      console.log(
        "⚠️ OpenAI API key not provided - AI responses will be disabled"
      );
    }
  }

  async generateResponse(message, context, wardrobeData) {
    if (!this.openai) {
      return "I'm sorry, but the AI service is not configured. Please set up your OpenAI API key to enable AI responses.";
    }

    const systemPrompt = this.buildSystemPrompt(wardrobeData);

    const messages = [
      { role: "system", content: systemPrompt },
      ...context.map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    try {
      console.log("🤖 Calling OpenAI API...");
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      return response;
    } catch (error) {
      console.error("❌ OpenAI API error:", error);

      if (error.code === "insufficient_quota") {
        return "I'm currently experiencing quota limitations with the AI service. I can still access your wardrobe data, but AI responses are temporarily limited.";
      }
      throw error;
    }
  }

  buildSystemPrompt(wardrobeData) {
    return `You are a personal wardrobe AI assistant with access to detailed wardrobe data. You must provide SPECIFIC, DATA-DRIVEN responses using the exact information provided.

CURRENT WARDROBE DATA:
- Active Items: ${wardrobeData.detailedAnalytics?.totalActiveItems || 0} items
- Total Outfits: ${
      wardrobeData.detailedAnalytics?.totalOutfits || 0
    } outfits logged
- Usage Entries: ${
      wardrobeData.detailedAnalytics?.totalUsageEntries || 0
    } individual wears tracked
- Total Investment: $${wardrobeData.costInsights?.totalInvestment || 0}

SPECIFIC SEASONAL DATA:
${JSON.stringify(wardrobeData.detailedAnalytics?.seasonalTrends || {}, null, 2)}

OCCASION TRENDS:
${JSON.stringify(wardrobeData.detailedAnalytics?.occasionTrends || {}, null, 2)}

DEPARTMENT BREAKDOWN:
${JSON.stringify(
  wardrobeData.detailedAnalytics?.departmentBreakdown || {},
  null,
  2
)}

PRICE ANALYSIS:
Average item cost: $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.average?.toFixed(2) || 0
    }
Total wardrobe investment: $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.total || 0
    }
Price range: $${wardrobeData.detailedAnalytics?.priceAnalysis?.min || 0} - $${
      wardrobeData.detailedAnalytics?.priceAnalysis?.max || 0
    }

MOST WORN OUTFITS:
${
  wardrobeData.detailedAnalytics?.mostWornItems
    ?.map((item) => `- ${item.item}: ${item.usage} times`)
    .join("\n") || "No usage data available"
}

CRITICAL INSTRUCTIONS:
1. ALWAYS use specific numbers from the data provided above
2. ALWAYS reference actual seasonal trends, occasion patterns, and department breakdowns
3. ALWAYS cite specific wear counts, costs, and statistics
4. NEVER give generic advice - only use the actual data provided
5. Always start responses with "Based on your wardrobe data..." and cite specific numbers

Be conversational but ALWAYS data-specific. Never give generic wardrobe advice.`;
  }
}

module.exports = AIService;
