// components/dashboard/charts/DepartmentPieChart.js
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, Package } from "lucide-react";
import { CHART_COLORS } from "../../../utilities/chartConstants";

export const DepartmentPieChart = ({ analytics }) => {
  const departmentData = Object.entries(analytics.departmentBreakdown || {})
    .map(([department, count]) => ({
      name: department,
      value: count,
      percentage:
        analytics.totalActiveItems > 0
          ? Math.round((count / analytics.totalActiveItems) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    if (percent < 0.05) return null; // Hide labels for slices < 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <PieIcon className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Wardrobe Breakdown</h3>
      </div>

      {departmentData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, "Items"]} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {departmentData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-sm">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                ></div>
                <span className="truncate capitalize">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={Package} message="No department data available" />
      )}
    </div>
  );
};

// Reusable empty state component
const EmptyState = ({ icon: Icon, message }) => (
  <div className="h-300 flex items-center justify-center text-gray-500">
    <div className="text-center">
      <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  </div>
);
