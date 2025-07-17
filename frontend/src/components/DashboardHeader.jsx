import React from "react";
import { RefreshCw } from "lucide-react";

const DashboardHeader = ({ onRefresh, isLoading, lastFetched }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wardrobe Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Your style analytics and insights
          {lastFetched && (
            <span className="text-sm ml-2">
              • Last updated: {new Date(lastFetched).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  </div>
);

export default DashboardHeader;
