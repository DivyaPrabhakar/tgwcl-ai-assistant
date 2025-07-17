// components/cost/ValueAnalysis.js - Best and worst value items analysis
import React from "react";
import { Star, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export const ValueAnalysis = ({ costData }) => {
  if (!costData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const bestValueItems = costData.bestValueItems || [];
  const worstValueItems = costData.worstValueItems || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Best Value Items */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-600">
            Best Value Items
          </h3>
        </div>

        {bestValueItems.length > 0 ? (
          <div className="space-y-3">
            {bestValueItems.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{item.wearCount} wears</span>
                      <span>•</span>
                      <span className="capitalize">
                        {item.category || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    ${item.costPerWear?.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">${item.price} total</p>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">
                  <strong>Great job!</strong> These items give you the most
                  value for your investment.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No value data available yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start logging item usage to see value analysis
            </p>
          </div>
        )}
      </div>

      {/* Worst Value Items (Needs More Wear) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-red-600">
            Needs More Wear
          </h3>
        </div>

        {worstValueItems.length > 0 ? (
          <div className="space-y-3">
            {worstValueItems.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{item.wearCount} wears</span>
                      <span>•</span>
                      <span className="capitalize">
                        {item.category || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600 text-lg">
                    ${item.costPerWear?.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">${item.price} total</p>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">
                  <strong>Opportunity:</strong> Try wearing these items more to
                  improve their value.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No value data available yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start logging item usage to see value analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
