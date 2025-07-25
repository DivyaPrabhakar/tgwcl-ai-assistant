// config/statusMatcher.js - Improved fuzzy matching for underscores and variations

const WARDROBE_CONFIG = require("./wardrobeConfig");

const STATUS_MATCHER = {
  /**
   * Calculate similarity between two strings (0-1, 1 = exact match)
   * IMPROVED: Better handling of underscores, spaces, and variations
   */
  calculateSimilarity: (str1, str2) => {
    // Normalize both strings for comparison
    const normalize = (str) =>
      str
        .toLowerCase()
        .trim()
        .replace(/_/g, " ") // Convert underscores to spaces
        .replace(/\s+/g, " "); // Normalize multiple spaces to single space

    const s1 = normalize(str1);
    const s2 = normalize(str2);


    // Exact match after normalization
    if (s1 === s2) {
      return 1.0;
    }

    // Contains match - either direction
    if (s1.includes(s2) || s2.includes(s1)) {
      const score = 0.9;
      return score;
    }

    // Word overlap - check if key words match
    const words1 = s1.split(/\s+/).filter((w) => w.length > 0);
    const words2 = s2.split(/\s+/).filter((w) => w.length > 0);
    const commonWords = words1.filter((word) => words2.includes(word));

    if (commonWords.length > 0) {
      const score =
        0.8 * (commonWords.length / Math.max(words1.length, words2.length));
      return score;
    }

    // Partial word matching (for things like "cleaners" matching "cleaner")
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.length >= 4 && word2.length >= 4) {
          // Check if one word starts with the other
          if (word1.startsWith(word2) || word2.startsWith(word1)) {
            const score = 0.7;
            return score;
          }

          // Check for very similar words (edit distance)
          const editDistance = STATUS_MATCHER.getEditDistance(word1, word2);
          const maxLength = Math.max(word1.length, word2.length);
          if (editDistance <= 2 && maxLength > 3) {
            const score = 0.6 * (1 - editDistance / maxLength);
            return score;
          }
        }
      }
    }

    // Character overlap (simple fallback)
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }

    const charScore = (matches / Math.max(s1.length, s2.length)) * 0.3;
    return charScore;
  },

  /**
   * Simple edit distance calculation
   */
  getEditDistance: (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  },

  /**
   * Find the best match for a status from target list
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

    if (bestMatch) {
    } else {
    }

    return bestMatch;
  },

  /**
   * Determine active statuses from actual Airtable data
   */
  determineActiveStatuses: (allActualStatuses) => {
    const activeMatches = [];
    const targetStatuses = WARDROBE_CONFIG.TARGET_ACTIVE_STATUSES;


    for (const actualStatus of allActualStatuses) {
      const match = STATUS_MATCHER.findBestMatch(
        actualStatus,
        targetStatuses,
        0.5 // 50% similarity threshold
      );

      if (match) {
        activeMatches.push({
          actual: actualStatus,
          target: match.target,
          score: match.score,
        });
      } else {
      }
    }

    const activeStatuses = activeMatches.map((m) => m.actual);
    const unmatchedStatuses = allActualStatuses.filter(
      (s) => !activeStatuses.includes(s)
    );


    return {
      activeStatuses,
      matches: activeMatches,
      unmatchedStatuses,
    };
  },
};

module.exports = STATUS_MATCHER;
