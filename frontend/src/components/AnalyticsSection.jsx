import React from "react";
import { TrendingUp, BarChart3 } from "lucide-react";

const AnalyticsSection = ({ analytics }) => {
  if (!analytics) return null;

  const hasSeasonalData =
    analytics.seasonalTrends &&
    Object.keys(analytics.seasonalTrends).length > 0;
  const hasDepartmentData =
    analytics.departmentBreakdown &&
    Object.keys(analytics.departmentBreakdown).length > 0;

  if (!hasSeasonalData && !hasDepartmentData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {hasSeasonalData && <SeasonalTrends data={analytics.seasonalTrends} />}
      {hasDepartmentData && (
        <DepartmentBreakdown data={analytics.departmentBreakdown} />
      )}
    </div>
  );
};

const SeasonalTrends = ({ data }) => {
  const maxCount = Math.max(...Object.values(data));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Seasonal Trends</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .map(([season, count]) => (
            <TrendItem
              key={season}
              label={season}
              count={count}
              percentage={(count / maxCount) * 100}
              suffix="wears"
              color="blue"
            />
          ))}
      </div>
    </div>
  );
};

const DepartmentBreakdown = ({ data }) => {
  const maxCount = Math.max(...Object.values(data));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Category Distribution
        </h3>
      </div>
      <div className="space-y-3">
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([category, count]) => (
            <TrendItem
              key={category}
              label={category}
              count={count}
              percentage={(count / maxCount) * 100}
              suffix="items"
              color="green"
            />
          ))}
      </div>
    </div>
  );
};

const TrendItem = ({ label, count, percentage, suffix, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700 capitalize">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        {count} {suffix}
      </span>
      <div className="w-12 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 bg-${color}-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  </div>
);

export default AnalyticsSection;
