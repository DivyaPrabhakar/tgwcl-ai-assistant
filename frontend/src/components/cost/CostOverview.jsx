// components/cost/CostOverview.js - Cost overview cards component
import React from "react";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Package,
  BarChart3,
} from "lucide-react";

export const CostOverview = ({ costData }) => {
  if (!costData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
          >
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Total Investment",
      value: `$${costData.totalInvestment?.toFixed(0) || 0}`,
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      description: "Lifetime wardrobe investment",
    },
    {
      title: "Active Investment",
      value: `$${costData.activeInvestment?.toFixed(0) || 0}`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Currently owned items",
    },
    {
      title: "Cost per Wear",
      value: `$${costData.investmentEfficiency?.toFixed(2) || 0}`,
      icon: Activity,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Average cost per use",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Items</p>
              <p className="text-xl font-bold text-gray-900">
                {costData.activeItemsCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Inactive Items
              </p>
              <p className="text-xl font-bold text-gray-900">
                {costData.inactiveItemsCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Wears</p>
              <p className="text-xl font-bold text-gray-900">
                {costData.totalWears || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Item Cost</p>
              <p className="text-xl font-bold text-gray-900">
                ${costData.averageActiveItemCost?.toFixed(0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Efficiency Bar */}
      {costData.activeInvestment && costData.totalInvestment && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Investment Efficiency</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Active Investment</span>
                <span className="font-medium">
                  ${costData.activeInvestment.toFixed(0)}(
                  {Math.round(
                    (costData.activeInvestment / costData.totalInvestment) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (costData.activeInvestment / costData.totalInvestment) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Inactive Investment</span>
                <span className="font-medium">
                  ${costData.inactiveInvestment?.toFixed(0) || 0}(
                  {Math.round(
                    ((costData.inactiveInvestment || 0) /
                      costData.totalInvestment) *
                      100
                  )}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      ((costData.inactiveInvestment || 0) /
                        costData.totalInvestment) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              <strong>Efficiency Score:</strong>{" "}
              {Math.round(
                (costData.activeInvestment / costData.totalInvestment) * 100
              )}
              % of your total investment is in items you still own and can wear.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
