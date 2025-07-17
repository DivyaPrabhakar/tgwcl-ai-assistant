// src/hooks/useDashboardData.js
import { useState, useEffect } from "react";

// Grade conversion functions
const gradeToNumeric = (grade) => {
  const gradeMap = {
    "A+": 4.3,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  };
  return gradeMap[grade?.toUpperCase()] || 0;
};

const numericToGrade = (numeric) => {
  if (numeric >= 4.15) return "A+";
  if (numeric >= 3.85) return "A";
  if (numeric >= 3.5) return "A-";
  if (numeric >= 3.15) return "B+";
  if (numeric >= 2.85) return "B";
  if (numeric >= 2.5) return "B-";
  if (numeric >= 2.15) return "C+";
  if (numeric >= 1.85) return "C";
  if (numeric >= 1.5) return "C-";
  if (numeric >= 1.15) return "D+";
  if (numeric >= 0.85) return "D";
  if (numeric >= 0.5) return "D-";
  return "F";
};

const useDashboardData = (currentView, API_BASE_URL) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeItems: 0,
      monthlySpend: 0,
      averageGrade: "N/A",
      averageGradeNumeric: 0,
      activeStatuses: [],
      loading: true,
    },
    recentActivity: [],
    activityLoading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch items data
        const itemsResponse = await fetch(`${API_BASE_URL}/api/wardrobe/items`);
        const itemsData = itemsResponse.ok ? await itemsResponse.json() : [];

        // Fetch recent usage log
        const usageResponse = await fetch(
          `${API_BASE_URL}/api/wardrobe/usage-log`
        );
        const usageData = usageResponse.ok ? await usageResponse.json() : [];

        console.log("Items data sample:", itemsData[0]);
        console.log("Usage data sample:", usageData[0]);

        // Get all unique statuses from the actual data
        const allStatuses = [
          ...new Set(
            itemsData.map((item) => item.status || item.Status).filter(Boolean)
          ),
        ];
        console.log("All possible statuses found in Airtable:", allStatuses);

        // Define which statuses represent "active items in closet"
        // You can modify this list based on what you see in the console
        const targetActiveStatuses = [
          "Active",
          "Ready to sell",
          "Lent",
          "In laundry at cleaners",
          "Needs repair",
        ];

        // Filter to only the statuses that actually exist in your data
        const activeStatuses = targetActiveStatuses.filter((status) =>
          allStatuses.includes(status)
        );

        // Also check for any other statuses that might represent active items
        const additionalActiveStatuses = allStatuses.filter(
          (status) =>
            !targetActiveStatuses.includes(status) &&
            !["Donated", "Sold", "Discarded", "Inactive", "Gone"].includes(
              status
            )
        );

        if (additionalActiveStatuses.length > 0) {
          console.log(
            "⚠️ Additional statuses found that might be active:",
            additionalActiveStatuses
          );
          console.log(
            "💡 Consider adding these to activeStatuses if they represent items in your closet"
          );
        }

        // Calculate active items in closet (only from main closet base, not finished items)
        const activeItems = itemsData.filter((item) => {
          const status = item.status || item.Status;
          return activeStatuses.includes(status);
        }).length;

        console.log("Filtering for these active statuses:", activeStatuses);
        console.log("Active items count:", activeItems);

        // Calculate monthly spend (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlySpend = itemsData.reduce((total, item) => {
          const purchaseDate =
            item.purchase_date || item["Purchase Date"] || item.date_purchased;
          const purchasePrice =
            item.purchase_price ||
            item["Purchase Price"] ||
            item.cost ||
            item.Cost;

          if (purchaseDate && purchasePrice) {
            const itemDate = new Date(purchaseDate);
            if (
              itemDate.getMonth() === currentMonth &&
              itemDate.getFullYear() === currentYear
            ) {
              return total + (parseFloat(purchasePrice) || 0);
            }
          }
          return total;
        }, 0);

        // Calculate average grade for this month
        const currentMonthUsage = usageData.filter((entry) => {
          const wornDate = entry.date_worn || entry.Date || entry["Date Worn"];
          if (wornDate) {
            const entryDate = new Date(wornDate);
            return (
              entryDate.getMonth() === currentMonth &&
              entryDate.getFullYear() === currentYear
            );
          }
          return false;
        });

        let averageGrade = "N/A";
        let averageGradeNumeric = 0;

        if (currentMonthUsage.length > 0) {
          const gradesWithValues = currentMonthUsage
            .map((entry) => {
              const grade =
                entry.grade || entry.Grade || entry.rating || entry.Rating;
              return gradeToNumeric(grade);
            })
            .filter((grade) => grade > 0);

          if (gradesWithValues.length > 0) {
            averageGradeNumeric =
              gradesWithValues.reduce((sum, grade) => sum + grade, 0) /
              gradesWithValues.length;
            averageGrade = numericToGrade(averageGradeNumeric);
          }
        }

        // Check for missing fields and log warnings
        if (activeItems === 0 && itemsData.length > 0) {
          console.warn("⚠️ NO ACTIVE ITEMS FOUND");
          console.log("Expected active statuses:", targetActiveStatuses);
          console.log("Found active statuses:", activeStatuses);
          console.log("All available statuses:", allStatuses);
          console.log(
            "Sample item status values:",
            itemsData.slice(0, 5).map((item) => ({
              id: item.id,
              status: item.status || item.Status,
            }))
          );
        }

        if (currentMonthUsage.length > 0) {
          const hasGrades = currentMonthUsage.some(
            (entry) =>
              entry.grade || entry.Grade || entry.rating || entry.Rating
          );
          if (!hasGrades) {
            console.warn(
              "⚠️ GRADE FIELD MISSING: Could not find grade field in usage log."
            );
            console.log(
              "Available usage fields:",
              Object.keys(currentMonthUsage[0] || {})
            );
          }
        }

        // Update stats
        setDashboardData((prev) => ({
          ...prev,
          stats: {
            activeItems,
            monthlySpend,
            averageGrade,
            averageGradeNumeric,
            activeStatuses,
            loading: false,
          },
          recentActivity: usageData.slice(0, 5).map((entry) => ({
            id: entry.id,
            date: entry.date_worn || entry.Date || "Unknown date",
            item: Array.isArray(entry.Item)
              ? entry.Item[0]
              : entry.Item || entry.item_name || "Unknown item",
            occasion: entry.occasion || entry.Occasion || "Casual",
            grade:
              entry.grade ||
              entry.Grade ||
              entry.rating ||
              entry.Rating ||
              "No grade",
            type: "wear",
          })),
          activityLoading: false,
        }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData((prev) => ({
          ...prev,
          stats: { ...prev.stats, loading: false, activeStatuses: [] },
          activityLoading: false,
        }));
      }
    };

    if (currentView === "dashboard") {
      fetchDashboardData();
    }
  }, [currentView, API_BASE_URL]);

  return dashboardData;
};

export default useDashboardData;
