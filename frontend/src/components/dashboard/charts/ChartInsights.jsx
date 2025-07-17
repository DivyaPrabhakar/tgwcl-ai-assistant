// components/dashboard/charts/ChartInsights.js
import React from "react";

export const ChartInsights = ({ analytics }) => {
  const departmentData = Object.entries(
    analytics.departmentBreakdown || {}
  ).sort(([, a], [, b]) => b - a);

  const seasonalData = Object.entries(analytics.seasonalTrends || {}).sort(
    ([, a], [, b]) => b - a
  );

  const occasionData = Object.entries(analytics.occasionTrends || {}).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Chart Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {departmentData[0]?.[0] || "N/A"}
          </div>
          <p className="text-gray-600">Top Category</p>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1 capitalize">
            {seasonalData[0]?.[0] || "N/A"}
          </div>
          <p className="text-gray-600">Peak Season</p>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {analytics.mostWornItems?.[0]?.usage || 0}
          </div>
          <p className="text-gray-600">Max Item Usage</p>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {occasionData[0]?.[0] || "N/A"}
          </div>
          <p className="text-gray-600">Top Occasion</p>
        </div>
      </div>
    </div>
  );
};
