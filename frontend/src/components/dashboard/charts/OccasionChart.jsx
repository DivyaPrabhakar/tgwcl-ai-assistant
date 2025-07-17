// components/dashboard/charts/OccasionChart.js
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
import { BarChart3, Activity } from "lucide-react";
import CustomTooltip from "../../CustomTooltip";
import { EmptyChartState } from "./EmptyChartState";

export const OccasionChart = ({ analytics }) => {
  const occasionData = Object.entries(analytics.occasionTrends || {})
    .map(([occasion, count]) => ({
      occasion: occasion,
      count: count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold">Occasion Analysis</h3>
      </div>

      {occasionData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={occasionData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="occasion"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState icon={Activity} message="No occasion data available" />
      )}
    </div>
  );
};
