// components/dashboard/ChartsGrid.js - Refactored for modularity and maintainability
import React from "react";
import { DepartmentPieChart } from "./charts/DepartmentPieChart";
import { SeasonalBarChart } from "./charts/SeasonalBarChart";
import { MostWornChart } from "./charts/MostWornChart";
import { UsageTrendChart } from "./charts/UsageTrendChart";
import { OccasionChart } from "./charts/OccasionChart";
import { StatusRadarChart } from "./charts/StatusRadarChart";
import { ChartInsights } from "./charts/ChartInsights";

export const ChartsGrid = ({ analytics }) => {
  if (!analytics) {
    return <ChartsGridSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Department & Seasonal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentPieChart analytics={analytics} />
        <SeasonalBarChart analytics={analytics} />
      </div>

      {/* Middle Row - Most Worn Items & Usage Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MostWornChart analytics={analytics} />
        <UsageTrendChart analytics={analytics} />
      </div>

      {/* Bottom Row - Occasions & Status Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccasionChart analytics={analytics} />
        <StatusRadarChart analytics={analytics} />
      </div>

      {/* Summary Insights */}
      <ChartInsights analytics={analytics} />
    </div>
  );
};

// Loading skeleton component
const ChartsGridSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
      >
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    ))}
  </div>
);
