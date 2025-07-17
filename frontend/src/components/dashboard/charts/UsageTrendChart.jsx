// components/dashboard/charts/UsageTrendChart.js
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import CustomTooltip from "../../CustomTooltip"; // Assuming you have a CustomTooltip component

export const UsageTrendChart = ({ analytics }) => {
  // Generate monthly trend based on seasonal data
  const monthlyTrend = [
    { month: "Jan", usage: (analytics.seasonalTrends?.winter || 0) * 0.3 },
    { month: "Feb", usage: (analytics.seasonalTrends?.winter || 0) * 0.4 },
    { month: "Mar", usage: (analytics.seasonalTrends?.spring || 0) * 0.3 },
    { month: "Apr", usage: (analytics.seasonalTrends?.spring || 0) * 0.4 },
    { month: "May", usage: (analytics.seasonalTrends?.spring || 0) * 0.3 },
    { month: "Jun", usage: (analytics.seasonalTrends?.summer || 0) * 0.3 },
    { month: "Jul", usage: (analytics.seasonalTrends?.summer || 0) * 0.4 },
    { month: "Aug", usage: (analytics.seasonalTrends?.summer || 0) * 0.3 },
    { month: "Sep", usage: (analytics.seasonalTrends?.fall || 0) * 0.3 },
    { month: "Oct", usage: (analytics.seasonalTrends?.fall || 0) * 0.4 },
    { month: "Nov", usage: (analytics.seasonalTrends?.fall || 0) * 0.3 },
    { month: "Dec", usage: (analytics.seasonalTrends?.winter || 0) * 0.3 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold">Usage Trend</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={monthlyTrend}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="usage"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
