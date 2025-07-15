// debug-statuses.js - Run this to see what's actually happening

// Add this to a test endpoint or run it directly
async function debugStatusMatching() {
  console.log("🔍 DEBUGGING STATUS MATCHING");
  console.log("=".repeat(50));

  // Get all items
  const allItems = await wardrobeService.getAllItems(true); // Force refresh
  console.log(`📊 Total items fetched: ${allItems.length}`);

  // Extract all unique statuses from actual data
  const allStatuses = [
    ...new Set(
      allItems
        .map((item) => item.status) // Direct field access
        .filter((status) => status && status !== null && status !== undefined)
    ),
  ].sort();

  console.log(`📋 Unique statuses found in Airtable (${allStatuses.length}):`);
  allStatuses.forEach((status, index) => {
    console.log(`   ${index + 1}. "${status}"`);
  });

  // Your target active patterns
  const targetPatterns = [
    "active",
    "in laundry",
    "at cleaners",
    "lent",
    "borrowed",
  ];

  console.log(`\n🎯 Your target patterns (${targetPatterns.length}):`);
  targetPatterns.forEach((pattern, index) => {
    console.log(`   ${index + 1}. "${pattern}"`);
  });

  // Test fuzzy matching
  console.log(`\n🔄 Testing fuzzy matching:`);
  const STATUS_MATCHER = require("./config/statusMatcher");
  const matchingResult = STATUS_MATCHER.determineActiveStatuses(allStatuses);

  console.log(
    `\n✅ Matched as ACTIVE (${matchingResult.activeStatuses.length}):`
  );
  matchingResult.activeStatuses.forEach((status, index) => {
    const match = matchingResult.matches.find((m) => m.actual === status);
    const target = match ? match.target : "unknown";
    const score = match ? Math.round(match.score * 100) : 0;
    console.log(`   ${index + 1}. "${status}" → "${target}" (${score}%)`);
  });

  console.log(`\n❌ NOT matched (${matchingResult.unmatchedStatuses.length}):`);
  matchingResult.unmatchedStatuses.forEach((status, index) => {
    console.log(`   ${index + 1}. "${status}"`);
  });

  // Count items by status
  console.log(`\n📈 Item counts by status:`);
  const statusCounts = {};
  allItems.forEach((item) => {
    const status = item.status || "null/undefined";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Sort by count
  const sortedCounts = Object.entries(statusCounts).sort(
    ([, a], [, b]) => b - a
  );

  sortedCounts.forEach(([status, count]) => {
    const isActive = matchingResult.activeStatuses.includes(status);
    const marker = isActive ? "✅" : "❌";
    console.log(`   ${marker} "${status}": ${count} items`);
  });

  // Calculate totals
  const activeItemCount = allItems.filter((item) =>
    matchingResult.activeStatuses.includes(item.status)
  ).length;

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total items: ${allItems.length}`);
  console.log(`   Active items (fuzzy matched): ${activeItemCount}`);
  console.log(`   Expected active (from Airtable filter): 758`);
  console.log(`   UI showing: 4308`);

  if (activeItemCount !== 758) {
    console.log(`\n🚨 MISMATCH DETECTED!`);
    console.log(
      `   Fuzzy matching is ${
        activeItemCount > 758 ? "over" : "under"
      }-counting by ${Math.abs(activeItemCount - 758)} items`
    );
  }

  return {
    totalItems: allItems.length,
    allStatuses,
    matchingResult,
    statusCounts,
    activeItemCount,
    expectedActive: 758,
  };
}

// Export for use in routes or manual testing
module.exports = { debugStatusMatching };
