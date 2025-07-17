// components/dashboard/charts/StatusRadarChart.js
import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Activity, Package } from "lucide-react";
import { EmptyChartState } from "../charts/EmptyChartState";

export const StatusRadarChart = ({ analytics }) => {
  const statusData = Object.entries(analytics.statusBreakdown || {})
    .map(([status, count]) => ({
      status: status.length > 10 ? status.substring(0, 10) + "..." : status,
      count: count,
      fullMark: Math.max(...Object.values(analytics.statusBreakdown || {})),
    }))
    .slice(0, 6);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <Activity className="h-5 w-5 text-rose-600 mr-2" />
        <h3 className="text-lg font-semibold">Status Distribution</h3>
      </div>

      {statusData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart
            data={statusData}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="status" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, "dataMax"]} />
            <Radar
              name="Count"
              dataKey="count"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState icon={Package} message="No status data available" />
      )}
    </div>
  );
};
