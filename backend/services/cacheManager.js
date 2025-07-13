// services/cacheManager.js - Cache management service
const fs = require("fs").promises;
const path = require("path");

class CacheManager {
  constructor() {
    // Get the config after requiring it to avoid circular dependencies
    const config = require("../config/config");
    this.dataDir = path.join(__dirname, "..", config.cache.dataDir);
    this.cacheExpiry = config.cache.expiry;

    // In-memory cache structure
    this.cache = {
      items: { data: null, timestamp: null, lastRecordId: null },
      inactiveItems: { data: null, timestamp: null, lastRecordId: null },
      outfits: { data: null, timestamp: null, lastRecordId: null },
      usageLog: { data: null, timestamp: null, lastRecordId: null },
      inspiration: { data: null, timestamp: null, lastRecordId: null },
      shoppingList: { data: null, timestamp: null, lastRecordId: null },
      avoids: { data: null, timestamp: null, lastRecordId: null },
    };
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log("✅ Data directory ensured");
    } catch (error) {
      console.error("❌ Error creating data directory:", error);
    }
  }

  async loadFromFile(key) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      const data = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(data);
      console.log(
        `📁 Loaded ${parsed.data?.length || 0} ${key} records from file`
      );
      return parsed;
    } catch (error) {
      console.log(`📁 No cached file found for ${key}, starting fresh`);
      return { data: [], timestamp: null, lastRecordId: null };
    }
  }

  async saveToFile(key, cacheEntry) {
    try {
      const filePath = path.join(this.dataDir, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
      console.log(
        `💾 Saved ${cacheEntry.data?.length || 0} ${key} records to file`
      );
    } catch (error) {
      console.error(`❌ Error saving ${key} to file:`, error);
    }
  }

  isCacheValid(cacheEntry) {
    if (!cacheEntry.data || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  async updateCache(key, data, lastRecordId = null) {
    this.cache[key] = {
      data: data,
      timestamp: Date.now(),
      lastRecordId: lastRecordId,
      fetching: false,
    };
    await this.saveToFile(key, this.cache[key]);
    console.log(`🔄 Cache updated for ${key}: ${data.length} records`);
  }

  async loadAllCachedData() {
    console.log("📂 Loading cached data from files...");
    for (const key of Object.keys(this.cache)) {
      this.cache[key] = await this.loadFromFile(key);
    }

    const totalCachedRecords = Object.values(this.cache).reduce(
      (sum, cacheEntry) => {
        return sum + (cacheEntry.data ? cacheEntry.data.length : 0);
      },
      0
    );

    console.log(`📊 Total cached records: ${totalCachedRecords}`);
    return totalCachedRecords;
  }

  getCacheStatus() {
    const status = {};
    Object.keys(this.cache).forEach((key) => {
      status[key] = {
        hasData: !!this.cache[key].data,
        recordCount: this.cache[key].data ? this.cache[key].data.length : 0,
        lastUpdated: this.cache[key].timestamp
          ? new Date(this.cache[key].timestamp).toISOString()
          : null,
        isValid: this.isCacheValid(this.cache[key]),
        lastRecordId: this.cache[key].lastRecordId,
      };
    });
    return status;
  }

  async clearAllCache() {
    // Clear in-memory cache
    Object.keys(this.cache).forEach((key) => {
      this.cache[key] = { data: null, timestamp: null, lastRecordId: null };
    });

    // Delete cache files
    for (const key of Object.keys(this.cache)) {
      try {
        await fs.unlink(path.join(this.dataDir, `${key}.json`));
      } catch (error) {
        // File might not exist, ignore
      }
    }

    console.log("🗑️ All cache cleared successfully");
  }

  getCacheEntry(key) {
    return this.cache[key];
  }

  setCacheFetching(key, fetching) {
    if (this.cache[key]) {
      this.cache[key].fetching = fetching;
    }
  }
}

module.exports = CacheManager;
