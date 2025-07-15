// services/airtableService.js - Refactored for easier debugging and maintenance

const Airtable = require("airtable");
const FieldNormalizer = require("./fieldNormalizer");

class AirtableService {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.fieldNormalizer = new FieldNormalizer();
    this.debugMode = process.env.NODE_ENV === "development";

    this.initializeBases();

    // Performance tracking
    this.metrics = {
      fetchCount: 0,
      cacheHits: 0,
      totalRecordsProcessed: 0,
      averageFetchTime: 0,
    };
  }

  // === INITIALIZATION ===

  initializeBases() {
    const config = require("../config/config");

    if (config.airtable.apiKey) {
      this.airtable = new Airtable({ apiKey: config.airtable.apiKey });

      this.bases = {
        closet: this.airtable.base(config.airtable.closetBaseId),
        references: this.airtable.base(config.airtable.referencesBaseId),
        finished: this.airtable.base(config.airtable.finishedBaseId),
      };

      this.log("✅ Airtable bases initialized", {
        closet: !!this.bases.closet,
        references: !!this.bases.references,
        finished: !!this.bases.finished,
      });
    } else {
      this.log("⚠️ No Airtable API key - running in cache-only mode");
      this.bases = {};
    }
  }

  // === MAIN DATA FETCHING METHODS ===

  async getItems(forceRefresh = false) {
    return this.fetchAndNormalize(
      "items",
      this.bases.closet,
      "Items",
      "All items",
      forceRefresh
    );
  }

  async getInactiveItems(forceRefresh = false) {
    return this.fetchAndNormalize(
      "inactiveItems",
      this.bases.finished,
      "Inactive items",
      null,
      forceRefresh
    );
  }

  async getAllItems(forceRefresh = false) {
    this.log("Fetching all items (active + inactive)");

    const [active, inactive] = await Promise.all([
      this.getItems(forceRefresh),
      this.getInactiveItems(forceRefresh),
    ]);

    const combined = [...active, ...inactive];
    this.log(
      `Combined items: ${active.length} active + ${inactive.length} inactive = ${combined.length} total`
    );

    return combined;
  }

  async getOutfits(forceRefresh = false) {
    return this.fetchAndNormalize(
      "outfits",
      this.bases.closet,
      "Outfits",
      "Evaluation view",
      forceRefresh,
      "id"
    );
  }

  async getUsageLog(forceRefresh = false) {
    // Try multiple configurations for usage log since field names might vary
    const configurations = [
      { table: "Usage Log", view: "Detailed view", sort: "date_worn" },
      { table: "Usage Log", view: "Grid view", sort: "date_worn" },
      { table: "Usage Log", sort: "date_worn" },
      { table: "Usage Log" },
    ];

    for (const config of configurations) {
      try {
        this.log(`Attempting usage log fetch with config:`, config);
        return await this.fetchAndNormalize(
          "usageLog",
          this.bases.closet,
          config.table,
          config.view,
          forceRefresh,
          config.sort
        );
      } catch (error) {
        this.log(`Config failed: ${error.message}`, config);
        continue;
      }
    }

    this.log("⚠️ All usage log configurations failed, returning empty array");
    return [];
  }

  async getInspiration(forceRefresh = false) {
    return this.fetchAndNormalize(
      "inspiration",
      this.bases.references,
      "Inspiration",
      null,
      forceRefresh
    );
  }

  async getShoppingList(forceRefresh = false) {
    return this.fetchAndNormalize(
      "shoppingList",
      this.bases.references,
      "Shopping list",
      null,
      forceRefresh
    );
  }

  async getAvoids(forceRefresh = false) {
    return this.fetchAndNormalize(
      "avoids",
      this.bases.references,
      "Avoids",
      null,
      forceRefresh
    );
  }

  // === CORE FETCH AND NORMALIZE METHOD ===

  async fetchAndNormalize(
    cacheKey,
    base,
    tableName,
    view = null,
    forceRefresh = false,
    sortField = null
  ) {
    const startTime = Date.now();

    // Check cache first
    if (!forceRefresh) {
      const cached = this.checkCache(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
    }

    // Fetch from Airtable
    const rawRecords = await this.fetchIncrementally(
      base,
      tableName,
      cacheKey,
      view,
      sortField
    );

    // Normalize the data
    const normalizedRecords = this.fieldNormalizer.normalizeRecords(rawRecords);

    // Update metrics
    this.updateMetrics(startTime, rawRecords.length);

    this.log(`✅ Fetch and normalize complete for ${tableName}`, {
      rawRecords: rawRecords.length,
      normalized: normalizedRecords.length,
      duration: Date.now() - startTime,
    });

    return normalizedRecords;
  }

  // === CACHE MANAGEMENT ===

  checkCache(cacheKey) {
    const cacheEntry = this.cacheManager.getCacheEntry(cacheKey);

    if (
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      this.log(
        `📦 Cache hit for ${cacheKey}: ${cacheEntry.data.length} records`
      );
      return this.fieldNormalizer.normalizeRecords(cacheEntry.data);
    }

    this.log(`📭 Cache miss for ${cacheKey}`);
    return null;
  }

  // === INCREMENTAL FETCHING ===

  async fetchIncrementally(
    base,
    tableName,
    cacheKey,
    view = null,
    sortField = null
  ) {
    if (!base) {
      this.log(
        `🔒 No base available for ${tableName}, returning cached data only`
      );
      return this.cacheManager.getCacheEntry(cacheKey).data || [];
    }

    const cacheEntry = this.cacheManager.getCacheEntry(cacheKey);
    if (cacheEntry.fetching) {
      this.log(`⏳ Already fetching ${tableName}, returning cached data`);
      return cacheEntry.data || [];
    }

    this.cacheManager.setCacheFetching(cacheKey, true);

    try {
      const result = await this.performFetch(
        base,
        tableName,
        cacheEntry,
        view,
        sortField
      );
      await this.cacheManager.updateCache(
        cacheKey,
        result.records,
        result.lastRecordId
      );
      return result.records;
    } catch (error) {
      this.logError(`Failed to fetch ${tableName}`, error);
      return cacheEntry.data || [];
    } finally {
      this.cacheManager.setCacheFetching(cacheKey, false);
    }
  }

  async performFetch(base, tableName, cacheEntry, view, sortField) {
    const existingData = cacheEntry.data || [];
    const lastRecordId = cacheEntry.lastRecordId;

    this.log(`🔄 Fetching ${tableName}`, {
      existing: existingData.length,
      lastRecordId: lastRecordId ? "present" : "none",
      view,
      sortField,
    });

    const selectOptions = this.buildSelectOptions(view, sortField);
    const fetchResult = await this.fetchPages(
      base,
      tableName,
      selectOptions,
      lastRecordId
    );

    const finalRecords = lastRecordId
      ? [...fetchResult.newRecords, ...existingData]
      : fetchResult.newRecords;

    const newLastRecordId =
      finalRecords.length > 0 ? finalRecords[0].id : lastRecordId;

    this.log(`✅ Fetch complete for ${tableName}`, {
      newRecords: fetchResult.newRecords.length,
      totalRecords: finalRecords.length,
      pages: fetchResult.pageCount,
    });

    return {
      records: finalRecords,
      lastRecordId: newLastRecordId,
    };
  }

  buildSelectOptions(view, sortField) {
    const options = {};
    if (view) options.view = view;
    if (sortField) options.sort = [{ field: sortField, direction: "desc" }];
    return options;
  }

  async fetchPages(base, tableName, selectOptions, lastRecordId) {
    const newRecords = [];
    let pageCount = 0;
    const maxPages = 50;

    return new Promise((resolve, reject) => {
      base(tableName)
        .select(selectOptions)
        .eachPage(
          (pageRecords, fetchNextPage) => {
            pageCount++;
            this.log(
              `📄 Processing page ${pageCount} for ${tableName}: ${pageRecords.length} records`
            );

            const shouldContinue = this.processPage(
              pageRecords,
              newRecords,
              lastRecordId,
              pageCount,
              maxPages
            );

            if (shouldContinue) {
              fetchNextPage();
            }
          },
          (error) => {
            if (error) {
              this.logError(`Error fetching pages for ${tableName}`, error);
              reject(error);
            } else {
              resolve({ newRecords, pageCount });
            }
          }
        );
    });
  }

  processPage(pageRecords, newRecords, lastRecordId, pageCount, maxPages) {
    if (!lastRecordId) {
      // No incremental fetch - get all records
      pageRecords.forEach((record) => {
        newRecords.push({
          id: record.id,
          ...record.fields,
        });
      });
      return pageCount < maxPages;
    } else {
      // Incremental fetch - stop when we hit the last known record
      for (const record of pageRecords) {
        if (record.id === lastRecordId) {
          return false; // Stop fetching
        }
        newRecords.push({
          id: record.id,
          ...record.fields,
        });
      }
      return pageCount < maxPages;
    }
  }

  // === UTILITY METHODS ===

  getFieldNormalizer() {
    return this.fieldNormalizer;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate:
        this.metrics.fetchCount > 0
          ? ((this.metrics.cacheHits / this.metrics.fetchCount) * 100).toFixed(
              1
            ) + "%"
          : "0%",
    };
  }

  resetMetrics() {
    this.metrics = {
      fetchCount: 0,
      cacheHits: 0,
      totalRecordsProcessed: 0,
      averageFetchTime: 0,
    };
    this.log("📊 Metrics reset");
  }

  updateMetrics(startTime, recordCount) {
    this.metrics.fetchCount++;
    this.metrics.totalRecordsProcessed += recordCount;

    const fetchTime = Date.now() - startTime;
    this.metrics.averageFetchTime =
      (this.metrics.averageFetchTime * (this.metrics.fetchCount - 1) +
        fetchTime) /
      this.metrics.fetchCount;
  }

  // === DEBUG METHODS ===

  async testConnection() {
    this.log("🔍 Testing Airtable connection...");

    const results = {
      hasApiKey: !!this.airtable,
      bases: {},
      testFetches: {},
    };

    if (!this.airtable) {
      this.log("❌ No Airtable API key configured");
      return results;
    }

    // Test each base
    for (const [baseName, base] of Object.entries(this.bases)) {
      try {
        results.bases[baseName] = !!base;
        this.log(`✅ Base ${baseName}: configured`);
      } catch (error) {
        results.bases[baseName] = false;
        this.logError(`❌ Base ${baseName}: error`, error);
      }
    }

    // Test small fetches
    const testCases = [
      { method: "getItems", description: "Active items" },
      { method: "getOutfits", description: "Outfits" },
      { method: "getInactiveItems", description: "Inactive items" },
    ];

    for (const testCase of testCases) {
      try {
        const data = await this[testCase.method](false);
        results.testFetches[testCase.method] = {
          success: true,
          count: data.length,
          sampleRecord: data[0] || null,
        };
        this.log(`✅ ${testCase.description}: ${data.length} records`);
      } catch (error) {
        results.testFetches[testCase.method] = {
          success: false,
          error: error.message,
        };
        this.logError(`❌ ${testCase.description}: failed`, error);
      }
    }

    return results;
  }

  // === LOGGING ===

  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`[${timestamp}] AirtableService: ${message}`);
      if (data) {
        console.log("  📊", data);
      }
    }
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.error(`[${timestamp}] AirtableService ERROR: ${message}`);
    if (error) {
      console.error("  💥", error.message || error);
    }
  }
}

module.exports = AirtableService;
