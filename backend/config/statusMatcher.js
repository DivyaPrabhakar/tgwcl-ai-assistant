// config/statusMatcher.js - Status fuzzy matching utilities

const WARDROBE_CONFIG = require("../config/wardrobeConfig");

const STATUS_MATCHER = {
  /**
   * Calculate similarity between two strings (0-1, 1 = exact match)
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
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

  /**
   * Find the best match for a status from target list
   * @param {string} actualStatus - Status to match
   * @param {Array} targetStatuses - Target statuses to match against
   * @param {number} threshold - Minimum similarity threshold (default: 0.5)
   * @returns {Object|null} - Best match with score, or null
   */
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

  /**
   * Determine active statuses from actual Airtable data
   * @param {Array} allActualStatuses - All statuses found in data
   * @returns {Object} - Matching results
   */
  determineActiveStatuses: (allActualStatuses) => {
    const activeMatches = [];
    const targetStatuses = WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES;

    console.log("🔍 STATUS MATCHING PROCESS:");
    console.log("📝 Input statuses:", allActualStatuses);
    console.log("🎯 Target patterns:", targetStatuses);

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
          `✅ "${actualStatus}" → "${match.target}" (${(
            match.score * 100
          ).toFixed(0)}%)`
        );
      } else {
        console.log(`❌ No match for "${actualStatus}"`);
      }
    }

    const activeStatuses = activeMatches.map((m) => m.actual);
    const unmatchedStatuses = allActualStatuses.filter(
      (s) => !activeStatuses.includes(s)
    );

    console.log("🎯 RESULTS:");
    console.log(`   Active: ${activeStatuses.join(", ")}`);
    console.log(`   Unmatched: ${unmatchedStatuses.join(", ")}`);

    return {
      activeStatuses,
      matches: activeMatches,
      unmatchedStatuses,
    };
  },

  /**
   * Test similarity calculation with examples
   * @param {Array} testPairs - Array of [str1, str2] pairs to test
   */
  testSimilarity: (testPairs) => {
    console.log("\n=== SIMILARITY TESTING ===");

    testPairs.forEach(([str1, str2]) => {
      const score = STATUS_MATCHER.calculateSimilarity(str1, str2);
      console.log(`"${str1}" vs "${str2}": ${(score * 100).toFixed(0)}%`);
    });

    console.log("=== END TESTING ===\n");
  },

  /**
   * Get matching statistics for a set of statuses
   * @param {Array} actualStatuses - Statuses to analyze
   * @returns {Object} - Matching statistics
   */
  getMatchingStats: (actualStatuses) => {
    const result = STATUS_MATCHER.determineActiveStatuses(actualStatuses);

    return {
      totalStatuses: actualStatuses.length,
      matchedStatuses: result.activeStatuses.length,
      unmatchedStatuses: result.unmatchedStatuses.length,
      matchRate:
        actualStatuses.length > 0
          ? (
              (result.activeStatuses.length / actualStatuses.length) *
              100
            ).toFixed(1) + "%"
          : "0%",
      averageScore:
        result.matches.length > 0
          ? (
              result.matches.reduce((sum, m) => sum + m.score, 0) /
              result.matches.length
            ).toFixed(2)
          : 0,
    };
  },
};

module.exports = STATUS_MATCHER;
