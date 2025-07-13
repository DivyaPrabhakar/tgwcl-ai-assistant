// services/airtableService.js - Airtable connection and data fetching
const Airtable = require("airtable");
const config = require("../config/config");

class AirtableService {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;

    // Initialize Airtable bases if API key is available
    if (config.airtable.apiKey) {
      this.airtable = new Airtable({
        apiKey: config.airtable.apiKey,
      });

      this.closetBase = this.airtable.base(config.airtable.closetBaseId);
      this.referencesBase = this.airtable.base(
        config.airtable.referencesBaseId
      );
      this.finishedBase = this.airtable.base(config.airtable.finishedBaseId);

      console.log("✅ Airtable bases configured");
    } else {
      console.log(
        "⚠️ Airtable API key not provided - running in cache-only mode"
      );
    }
  }

  async fetchIncrementally(
    base,
    tableName,
    cacheKey,
    view = null,
    sortField = null
  ) {
    if (!base) {
      console.log(
        `🔒 No base available for ${tableName}, returning cached data`
      );
      return this.cacheManager.getCacheEntry(cacheKey).data || [];
    }

    const cacheEntry = this.cacheManager.getCacheEntry(cacheKey);
    if (cacheEntry.fetching) {
      console.log(`⏳ Already fetching ${tableName}, returning cached data`);
      return cacheEntry.data || [];
    }

    this.cacheManager.setCacheFetching(cacheKey, true);

    try {
      const existingData = cacheEntry.data || [];
      const lastRecordId = cacheEntry.lastRecordId;

      console.log(
        `🔄 Fetching ${tableName} incrementally... (${existingData.length} existing records)`
      );

      const selectOptions = {};
      if (view) selectOptions.view = view;
      if (sortField)
        selectOptions.sort = [{ field: sortField, direction: "desc" }];

      let allRecords = [];
      let pageCount = 0;
      const maxPages = 50;

      await base(tableName)
        .select(selectOptions)
        .eachPage((pageRecords, fetchNextPage) => {
          pageCount++;
          console.log(
            `📄 Processing page ${pageCount} with ${pageRecords.length} records for ${tableName}`
          );

          if (!lastRecordId) {
            for (const record of pageRecords) {
              allRecords.push({
                id: record.id,
                status: cacheKey.includes("inactive") ? "inactive" : "active",
                ...record.fields,
              });
            }
            if (pageCount < maxPages) fetchNextPage();
          } else {
            let foundLastRecord = false;
            for (const record of pageRecords) {
              if (record.id === lastRecordId) {
                foundLastRecord = true;
                break;
              }
              allRecords.push({
                id: record.id,
                status: cacheKey.includes("inactive") ? "inactive" : "active",
                ...record.fields,
              });
            }
            if (!foundLastRecord && pageCount < maxPages) fetchNextPage();
          }
        });

      const finalRecords = lastRecordId
        ? [...allRecords, ...existingData]
        : allRecords;
      const newLastRecordId =
        finalRecords.length > 0 ? finalRecords[0].id : lastRecordId;

      await this.cacheManager.updateCache(
        cacheKey,
        finalRecords,
        newLastRecordId
      );
      return finalRecords;
    } catch (error) {
      console.error(`❌ Error fetching ${tableName}:`, error.message);
      return cacheEntry.data || [];
    } finally {
      this.cacheManager.setCacheFetching(cacheKey, false);
    }
  }

  async getItems(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("items");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      console.log("📦 Returning cached items");
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.closetBase,
      "Items",
      "items",
      "All items"
    );
  }

  async getInactiveItems(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("inactiveItems");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      console.log("📦 Returning cached inactive items");
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.finishedBase,
      "Inactive items",
      "inactiveItems"
    );
  }

  async getAllItems(forceRefresh = false) {
    const [active, inactive] = await Promise.all([
      this.getItems(forceRefresh),
      this.getInactiveItems(forceRefresh),
    ]);
    return [...active, ...inactive];
  }

  async getOutfits(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("outfits");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      console.log("📦 Returning cached outfits");
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.closetBase,
      "Outfits",
      "outfits",
      "Evaluation view",
      "id"
    );
  }

  async getUsageLog(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("usageLog");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      console.log("📦 Returning cached usage log");
      return cacheEntry.data;
    }

    const possibleConfigs = [
      { table: "Usage Log", view: "Detailed view", sort: "date_worn" },
      { table: "Usage Log", view: "Grid view", sort: "date_worn" },
      { table: "Usage Log", sort: "date_worn" },
      { table: "Usage Log" },
    ];

    for (const config of possibleConfigs) {
      try {
        return await this.fetchIncrementally(
          this.closetBase,
          config.table,
          "usageLog",
          config.view,
          config.sort
        );
      } catch (error) {
        console.log(`❌ Config failed: ${error.message}`);
        continue;
      }
    }
    return [];
  }

  async getInspiration(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("inspiration");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.referencesBase,
      "Inspiration",
      "inspiration"
    );
  }

  async getShoppingList(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("shoppingList");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.referencesBase,
      "Shopping list",
      "shoppingList"
    );
  }

  async getAvoids(forceRefresh = false) {
    const cacheEntry = this.cacheManager.getCacheEntry("avoids");
    if (
      !forceRefresh &&
      this.cacheManager.isCacheValid(cacheEntry) &&
      cacheEntry.data?.length > 0
    ) {
      return cacheEntry.data;
    }
    return await this.fetchIncrementally(
      this.referencesBase,
      "Avoids",
      "avoids"
    );
  }
}

module.exports = AirtableService;
