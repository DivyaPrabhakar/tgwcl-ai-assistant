// components/dashboard/charts/SeasonalBarChart.js
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";
import CustomTooltip from "../../CustomTooltip";

export const SeasonalBarChart = ({ analytics }) => {
  const seasonalData = Object.entries(analytics.seasonalTrends || {}).map(
    ([season, count]) => ({
      season: season.charAt(0).toUpperCase() + season.slice(1),
      usage: count,
      percentage:
        analytics.totalUsageEntries > 0
          ? Math.round((count / analytics.totalUsageEntries) * 100)
          : 0,
    })
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold">Seasonal Usage</h3>
      </div>

      {seasonalData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={seasonalData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="season" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="usage" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState icon={Calendar} message="No seasonal usage data" />
      )}
    </div>
  );
};

const EmptyState = ({ icon: Icon, message }) => (
  <div className="h-300 flex items-center justify-center text-gray-500">
    <div className="text-center">
      <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  </div>
);
