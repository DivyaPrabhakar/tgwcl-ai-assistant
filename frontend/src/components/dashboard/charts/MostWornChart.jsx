// components/dashboard/charts/MostWornChart.js
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
import { Star, Shirt } from "lucide-react";
import { truncateText } from "../../../utilities/truncateText";
import CustomTooltip from "../../CustomTooltip";
import { EmptyChartState } from "./EmptyChartState";

export const MostWornChart = ({ analytics }) => {
  const mostWornData = (analytics.mostWornItems || [])
    .slice(0, 10)
    .map((item, index) => ({
      item: truncateText(item.item),
      usage: item.usage,
      rank: index + 1,
    }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold">Most Worn Items</h3>
      </div>

      {mostWornData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={mostWornData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="item" type="category" width={80} fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="usage" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState icon={Shirt} message="No usage data available" />
      )}
    </div>
  );
};
