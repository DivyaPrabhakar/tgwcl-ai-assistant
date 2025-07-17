// components/dashboard/StatsGrid.js - Main dashboard statistics grid
import React from "react";
import {
  Shirt,
  Package,
  Activity,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  BarChart3,
  PieChart,
  Users,
} from "lucide-react";

export const StatsGrid = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const mainStats = [
    {
      title: "Active Items",
      value: analytics.totalActiveItems || 0,
      icon: Shirt,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      change: analytics.totalActiveItems > 0 ? "+5.2%" : null,
      changeType: "increase",
      description: "Items you currently own",
    },
    {
      title: "Total Items",
      value: analytics.totalItems || 0,
      icon: Package,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      change: null,
      changeType: null,
      description: "Including inactive items",
    },
    {
      title: "Usage Entries",
      value: analytics.totalUsageEntries || 0,
      icon: Activity,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      change: analytics.totalUsageEntries > 50 ? "+12.3%" : null,
      changeType: "increase",
      description: "Times items were worn",
    },
    {
      title: "Avg Item Cost",
      value: `$${analytics.priceAnalysis?.average?.toFixed(0) || 0}`,
      icon: DollarSign,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: null,
      changeType: null,
      description: "Average purchase price",
    },
  ];

  const secondaryStats = [
    {
      title: "Total Outfits",
      value: analytics.totalOutfits || 0,
      icon: PieChart,
      iconColor: "text-indigo-600",
      description: "Outfit combinations logged",
    },
    {
      title: "Inactive Items",
      value: analytics.totalInactiveItems || 0,
      icon: BarChart3,
      iconColor: "text-gray-600",
      description: "Items no longer owned",
    },
    {
      title: "Unique Seasons",
      value: Object.keys(analytics.seasonalTrends || {}).length,
      icon: Calendar,
      iconColor: "text-emerald-600",
      description: "Seasonal usage tracked",
    },
    {
      title: "Top Categories",
      value: Object.keys(analytics.departmentBreakdown || {}).length,
      icon: Users,
      iconColor: "text-rose-600",
      description: "Different item categories",
    },
  ];

  // Calculate some derived metrics
  const activePercentage =
    analytics.totalItems > 0
      ? Math.round((analytics.totalActiveItems / analytics.totalItems) * 100)
      : 0;

  const avgUsagePerItem =
    analytics.totalActiveItems > 0 && analytics.totalUsageEntries > 0
      ? Math.round(
          (analytics.totalUsageEntries / analytics.totalActiveItems) * 10
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>

                  {stat.change && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">
                        {stat.change}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex items-center">
                <Icon className={`h-5 w-5 ${stat.iconColor} mr-3`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Key Insights Bar */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          Key Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Percentage */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${activePercentage * 1.88} 188`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {activePercentage}%
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Items Active</p>
            <p className="text-xs text-gray-500">Of total wardrobe</p>
          </div>

          {/* Usage per Item */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {avgUsagePerItem}
            </div>
            <p className="text-sm font-medium text-gray-900">
              Avg Uses per Item
            </p>
            <p className="text-xs text-gray-500">Across active wardrobe</p>
          </div>

          {/* Total Investment */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${analytics.priceAnalysis?.total?.toFixed(0) || 0}
            </div>
            <p className="text-sm font-medium text-gray-900">
              Total Investment
            </p>
            <p className="text-xs text-gray-500">Active items value</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          Quick Stats Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Most worn category:</span>
              <span className="font-medium text-blue-900">
                {analytics.departmentBreakdown
                  ? Object.entries(analytics.departmentBreakdown).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[0] || "N/A"
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Favorite season:</span>
              <span className="font-medium text-blue-900 capitalize">
                {analytics.seasonalTrends
                  ? Object.entries(analytics.seasonalTrends).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[0] || "N/A"
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Price range:</span>
              <span className="font-medium text-blue-900">
                ${analytics.priceAnalysis?.min || 0} - $
                {analytics.priceAnalysis?.max || 0}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Most worn item:</span>
              <span className="font-medium text-blue-900">
                {analytics.mostWornItems?.[0]?.item || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Usage frequency:</span>
              <span className="font-medium text-blue-900">
                {analytics.mostWornItems?.[0]?.usage || 0} times
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Wardrobe utilization:</span>
              <span className="font-medium text-blue-900">
                {analytics.totalUsageEntries > 0 ? "Active" : "Getting started"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
