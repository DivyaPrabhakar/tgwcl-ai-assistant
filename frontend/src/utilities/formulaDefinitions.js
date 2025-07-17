// src/utils/formulaDefinitions.js

// Dynamic formula definitions that update with actual data
export const getFormulas = (activeStatuses) => ({
  activeItems: {
    title: "Active Items in Closet Count",
    description: "Number of items currently in your physical closet",
    formula: `COUNT(Items FROM DVP_CLOSET_2_20_2025.Items WHERE status IN [${activeStatuses
      .map((s) => `'${s}'`)
      .join(", ")}])`,
    explanation: `This counts all items in your DVP_CLOSET_2_20_2025 Airtable base, Items table, that have any of these specific statuses: ${activeStatuses.join(
      ", "
    )}. These represent items physically in your possession or temporarily away but still yours. Items from the DVP_CLOSET_FINISHED_ITEMS_7_2025 database are completely excluded from this count.`,
    statusesIncluded: activeStatuses,
    dataSource: "DVP_CLOSET_2_20_2025 → Items table → status field",
    excludedSources: "DVP_CLOSET_FINISHED_ITEMS_7_2025 (all items excluded)",
    lastUpdated: "Real-time from database",
  },
  monthlySpend: {
    title: "Monthly Spend",
    description: "Total amount spent on new items this month",
    formula:
      "SUM(purchase_price FROM DVP_CLOSET_2_20_2025.Items WHERE purchase_date >= start_of_current_month)",
    explanation:
      "Sums the purchase_price field for all items in the DVP_CLOSET_2_20_2025 Items table where the purchase_date falls within the current calendar month. Only includes items actually purchased this month.",
    dataSource:
      "DVP_CLOSET_2_20_2025 → Items table → purchase_price and purchase_date fields",
    lastUpdated: "Real-time from database",
  },
  averageGrade: {
    title: "Average Outfit Grade",
    description: "Average grade of outfits worn this month",
    formula:
      "AVERAGE(grade_numeric FROM DVP_CLOSET_2_20_2025.UsageLog WHERE date_worn >= start_of_current_month)",
    explanation:
      "Converts letter grades (A+ through F) from the Usage Log table to numeric values (4.3 to 0.0), calculates the average, then converts back to letter grade. Only includes usage entries from the current month in the DVP_CLOSET_2_20_2025 base.",
    gradeScale:
      "A+ = 4.3, A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, B- = 2.7, C+ = 2.3, C = 2.0, C- = 1.7, D+ = 1.3, D = 1.0, D- = 0.7, F = 0.0",
    dataSource:
      "DVP_CLOSET_2_20_2025 → Usage Log table → grade and date_worn fields",
    lastUpdated: "Real-time from database",
  },
});
