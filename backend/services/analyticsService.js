// services/analyticsService.js - Refactored with dynamic status support
const {
  WARDROBE_CONFIG,
  FIELD_EXTRACTORS,
  STATUS_UTILS,
} = require("../config/constants");

class AnalyticsService {
  constructor(airtableService) {
    this.airtableService = airtableService;
  }

  /**
   * Analyze usage patterns with dynamic status-based filtering
   */
  async analyzeUsagePatterns(forceRefresh = false, statusConfig = null) {
    try {
      console.log(
        "📊 Analyzing usage patterns with dynamic status configuration..."
      );

      const [items, usageLog, outfits] = await Promise.all([
        this.airtableService.getAllItems(forceRefresh),
        this.airtableService.getUsageLog(forceRefresh),
        this.airtableService.getOutfits(forceRefresh),
      ]);

      console.log("📊 Raw data loaded:", {
        items: items.length,
        usageLog: usageLog.length,
        outfits: outfits.length,
      });

      // Use dynamic status configuration if provided
      const activeStatuses = statusConfig?.activeStatuses || [];
      console.log("🏷️ Using active statuses:", activeStatuses);

      // Categorize items by dynamic status
      const categorizedItems = STATUS_UTILS.categorizeByStatus(
        items,
        activeStatuses
      );

      // Calculate analytics for different item categories
      const analytics = {
        // Basic counts
        totalActiveItems: categorizedItems.active.length,
        totalInactiveItems: categorizedItems.inactive.length,
        totalItems: items.length,
        totalOutfits: outfits.length,
        totalUsageEntries: usageLog.length,

        // Status analysis
        statusBreakdown: this._calculateStatusBreakdown(items),

        // Temporal analysis
        seasonalTrends: this._analyzeSeasonalTrends(usageLog),
        occasionTrends: this._analyzeOccasionTrends(usageLog),

        // Category analysis (active items only)
        departmentBreakdown: this._analyzeDepartmentBreakdown(
          categorizedItems.active
        ),

        // Usage analysis
        mostWornItems: this._analyzeMostWornItems(usageLog),

        // Price analysis (active items only)
        priceAnalysis: this._analyzePrices(categorizedItems.active),

        // Dynamic status configuration
        statusConfig: statusConfig,
      };

      console.log("✅ Analytics completed:", {
        totalActiveItems: analytics.totalActiveItems,
        totalItems: analytics.totalItems,
        statusCount: Object.keys(analytics.statusBreakdown).length,
        seasonalTrends: Object.keys(analytics.seasonalTrends).length,
        activeStatusesUsed: activeStatuses.length,
      });

      return analytics;
    } catch (error) {
      console.error("❌ Error in analyzeUsagePatterns:", error);
      return this._getEmptyAnalytics(error.message);
    }
  }

  /**
   * Enhanced cost analysis with dynamic status-based categorization
   */
  async getCostAnalysis(forceRefresh = false, statusConfig = null) {
    try {
      console.log("💰 Analyzing costs with dynamic status configuration...");

      const [items, usageLog] = await Promise.all([
        this.airtableService.getAllItems(forceRefresh),
        this.airtableService.getUsageLog(forceRefresh),
      ]);

      // Use dynamic status configuration
      const activeStatuses = statusConfig?.activeStatuses || [];

      // Categorize items by dynamic status
      const categorizedItems = STATUS_UTILS.categorizeByStatus(
        items,
        activeStatuses
      );

      console.log("💰 Cost analysis categorization:", {
        active: categorizedItems.active.length,
        inactive: categorizedItems.inactive.length,
        activeStatuses: activeStatuses,
      });

      // Calculate costs for each category
      const activeCosts = this._calculateCosts(categorizedItems.active);
      const inactiveCosts = this._calculateCosts(categorizedItems.inactive);

      // Analyze usage for cost per wear
      const itemUsage = this._calculateItemUsage(usageLog);
      const costPerWearAnalysis = this._calculateCostPerWear(
        categorizedItems.active,
        itemUsage
      );

      const costAnalysis = {
        // Total investments
        totalInvestment: activeCosts.total + inactiveCosts.total,
        activeInvestment: activeCosts.total,
        inactiveInvestment: inactiveCosts.total,

        // Item counts
        activeItemsCount: categorizedItems.active.length,
        inactiveItemsCount: categorizedItems.inactive.length,

        // Average costs
        averageActiveItemCost: activeCosts.average,
        averageInactiveItemCost: inactiveCosts.average,

        // Cost per wear insights
        bestValueItems: costPerWearAnalysis.best,
        worstValueItems: costPerWearAnalysis.worst,

        // Usage statistics
        totalWears: Object.values(itemUsage).reduce(
          (sum, count) => sum + count,
          0
        ),

        // Investment efficiency
        investmentEfficiency: this._calculateInvestmentEfficiency(
          activeCosts.total,
          Object.values(itemUsage).reduce((sum, count) => sum + count, 0)
        ),

        // Category cost breakdown (active items only)
        categoryCostBreakdown: this._analyzeCategoryCosts(
          categorizedItems.active
        ),

        // Status configuration used
        statusConfig: statusConfig,
      };

      console.log("✅ Cost analysis completed:", {
        totalInvestment: costAnalysis.totalInvestment,
        activeInvestment: costAnalysis.activeInvestment,
        bestValueItems: costAnalysis.bestValueItems.length,
        activeStatusesUsed: activeStatuses.length,
      });

      return costAnalysis;
    } catch (error) {
      console.error("❌ Error in getCostAnalysis:", error);
      return this._getEmptyCostAnalysis(error.message);
    }
  }

  // === PRIVATE ANALYSIS METHODS ===

  /**
   * Calculate status breakdown for all items
   */
  _calculateStatusBreakdown(items) {
    const breakdown = {};

    items.forEach((item) => {
      const status = FIELD_EXTRACTORS.extractStatus(item);
      breakdown[status] = (breakdown[status] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Analyze seasonal trends from usage log
   */
  _analyzeSeasonalTrends(usageLog) {
    const seasonalTrends = {};

    usageLog.forEach((entry) => {
      const dateValue = FIELD_EXTRACTORS.getFieldValue(entry, "DATE_WORN");
      if (dateValue) {
        const season = FIELD_EXTRACTORS.getSeason(dateValue);
        seasonalTrends[season] = (seasonalTrends[season] || 0) + 1;
      }
    });

    return seasonalTrends;
  }

  /**
   * Analyze occasion trends from usage log
   */
  _analyzeOccasionTrends(usageLog) {
    const occasionTrends = {};

    usageLog.forEach((entry) => {
      const occasion = FIELD_EXTRACTORS.getFieldValue(entry, "OCCASION");
      if (occasion) {
        occasionTrends[occasion] = (occasionTrends[occasion] || 0) + 1;
      }
    });

    return occasionTrends;
  }

  /**
   * Analyze department/category breakdown for active items
   */
  _analyzeDepartmentBreakdown(activeItems) {
    const departmentBreakdown = {};

    activeItems.forEach((item) => {
      const category = FIELD_EXTRACTORS.extractCategory(item);
      departmentBreakdown[category] = (departmentBreakdown[category] || 0) + 1;
    });

    return departmentBreakdown;
  }

  /**
   * Analyze most worn items
   */
  _analyzeMostWornItems(usageLog) {
    const itemUsage = this._calculateItemUsage(usageLog);

    return Object.entries(itemUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, WARDROBE_CONFIG.ANALYTICS.TOP_ITEMS_COUNT)
      .map(([item, usage]) => ({ item, usage }));
  }

  /**
   * Calculate item usage from usage log
   */
  _calculateItemUsage(usageLog) {
    const itemUsage = {};

    usageLog.forEach((entry) => {
      const itemName = FIELD_EXTRACTORS.extractItemName(entry);
      if (itemName) {
        itemUsage[itemName] = (itemUsage[itemName] || 0) + 1;
      }
    });

    return itemUsage;
  }

  /**
   * Analyze prices for a set of items
   */
  _analyzePrices(items) {
    const prices = items
      .map((item) => FIELD_EXTRACTORS.extractPrice(item))
      .filter((price) => price > 0);

    if (prices.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, count: 0 };
    }

    return {
      total: prices.reduce((sum, price) => sum + price, 0),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
    };
  }

  /**
   * Calculate costs for a category of items
   */
  _calculateCosts(items) {
    const prices = items
      .map((item) => FIELD_EXTRACTORS.extractPrice(item))
      .filter((price) => price > 0);

    const total = prices.reduce((sum, price) => sum + price, 0);

    return {
      total,
      average: prices.length > 0 ? total / prices.length : 0,
      count: prices.length,
    };
  }

  /**
   * Calculate cost per wear analysis
   */
  _calculateCostPerWear(activeItems, itemUsage) {
    const costPerWearData = activeItems
      .map((item) => {
        const price = FIELD_EXTRACTORS.extractPrice(item);
        const itemName = FIELD_EXTRACTORS.extractItemName(item);
        const wearCount = itemUsage[itemName] || 0;

        return {
          name: itemName,
          price: price,
          wearCount: wearCount,
          costPerWear: wearCount > 0 ? price / wearCount : price,
          category: FIELD_EXTRACTORS.extractCategory(item),
          status: FIELD_EXTRACTORS.extractStatus(item),
        };
      })
      .filter((item) => item.price > 0);

    const sorted = costPerWearData.sort(
      (a, b) => a.costPerWear - b.costPerWear
    );

    return {
      best: sorted.slice(0, WARDROBE_CONFIG.ANALYTICS.TOP_ITEMS_COUNT),
      worst: sorted.slice(-WARDROBE_CONFIG.ANALYTICS.TOP_ITEMS_COUNT).reverse(),
    };
  }

  /**
   * Calculate investment efficiency metric
   */
  _calculateInvestmentEfficiency(totalInvestment, totalWears) {
    if (totalWears === 0) return 0;
    return totalInvestment / totalWears;
  }

  /**
   * Analyze costs by category
   */
  _analyzeCategoryCosts(activeItems) {
    const categoryBreakdown = {};

    activeItems.forEach((item) => {
      const category = FIELD_EXTRACTORS.extractCategory(item);
      const price = FIELD_EXTRACTORS.extractPrice(item);

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { total: 0, count: 0, items: [] };
      }

      categoryBreakdown[category].total += price;
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].items.push({
        name: FIELD_EXTRACTORS.extractItemName(item),
        price: price,
      });
    });

    // Calculate averages
    Object.keys(categoryBreakdown).forEach((category) => {
      const data = categoryBreakdown[category];
      data.average = data.count > 0 ? data.total / data.count : 0;
    });

    return categoryBreakdown;
  }

  // === ERROR HANDLING ===

  /**
   * Return empty analytics structure on error
   */
  _getEmptyAnalytics(errorMessage = "Unknown error") {
    return {
      totalActiveItems: 0,
      totalInactiveItems: 0,
      totalItems: 0,
      totalOutfits: 0,
      totalUsageEntries: 0,
      statusBreakdown: {},
      seasonalTrends: {},
      occasionTrends: {},
      departmentBreakdown: {},
      mostWornItems: [],
      priceAnalysis: { total: 0, average: 0, min: 0, max: 0, count: 0 },
      statusConfig: null,
      error: errorMessage,
    };
  }

  /**
   * Return empty cost analysis structure on error
   */
  _getEmptyCostAnalysis(errorMessage = "Unknown error") {
    return {
      totalInvestment: 0,
      activeInvestment: 0,
      inactiveInvestment: 0,
      activeItemsCount: 0,
      inactiveItemsCount: 0,
      averageActiveItemCost: 0,
      averageInactiveItemCost: 0,
      bestValueItems: [],
      worstValueItems: [],
      totalWears: 0,
      investmentEfficiency: 0,
      categoryCostBreakdown: {},
      statusConfig: null,
      error: errorMessage,
    };
  }
}

module.exports = AnalyticsService;
