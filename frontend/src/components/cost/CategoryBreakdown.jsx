// components/cost/CategoryBreakdown.js - Investment breakdown by category
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Shirt, Package, DollarSign } from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export const CategoryBreakdown = ({ costData }) => {
  if (!costData || !costData.categoryCostBreakdown) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Investment by Category</h3>
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No category breakdown available</p>
          <p className="text-sm text-gray-400 mt-1">
            Category data will appear when items are properly categorized
          </p>
        </div>
      </div>
    );
  }

  const categoryData = Object.entries(costData.categoryCostBreakdown).map(
    ([category, data]) => ({
      name: category,
      total: data.total || 0,
      count: data.count || 0,
      average: data.average || 0,
    })
  );

  // Sort by total investment descending
  const sortedCategoryData = categoryData.sort((a, b) => b.total - a.total);

  // Prepare data for pie chart
  const pieData = categoryData.map((item, index) => ({
    name: item.name,
    value: item.total,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Category Investment Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
          Investment by Category
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700">Total Investment</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sortedCategoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis tickFormatter={(value) => `$${value}`} fontSize={12} />
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toFixed(0)}`,
                    "Investment",
                  ]}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700">
              Investment Distribution
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Details Grid */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shirt className="h-5 w-5 mr-2 text-green-600" />
          Category Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategoryData.map((category, index) => (
            <div
              key={category.name}
              className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
              style={{ borderColor: COLORS[index % COLORS.length] + "40" }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize text-gray-900">
                  {category.name}
                </h4>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Total Investment:
                  </span>
                  <span
                    className="font-semibold text-lg"
                    style={{ color: COLORS[index % COLORS.length] }}
                  >
                    ${category.total.toFixed(0)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-medium">{category.count}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg per item:</span>
                  <span className="font-medium">
                    ${category.average.toFixed(0)}
                  </span>
                </div>

                {/* Investment percentage */}
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">% of total investment</span>
                    <span className="font-medium">
                      {(
                        (category.total /
                          categoryData.reduce(
                            (sum, cat) => sum + cat.total,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Category Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-gray-700">
              Highest Investment
            </h4>
            <div className="space-y-2">
              {sortedCategoryData.slice(0, 3).map((category, index) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="capitalize">{category.name}</span>
                  </div>
                  <span className="font-semibold">
                    ${category.total.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-gray-700">
              Highest Average Cost
            </h4>
            <div className="space-y-2">
              {sortedCategoryData
                .sort((a, b) => b.average - a.average)
                .slice(0, 3)
                .map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="capitalize">{category.name}</span>
                    </div>
                    <span className="font-semibold">
                      ${category.average.toFixed(0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
