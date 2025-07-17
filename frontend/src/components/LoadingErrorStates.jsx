import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

export const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex items-center gap-3 text-gray-600">
      <RefreshCw className="h-6 w-6 animate-spin" />
      <span className="text-lg">Loading your wardrobe dashboard...</span>
    </div>
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Error Loading Dashboard
      </h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
      >
        <RefreshCw size={18} />
        Retry
      </button>
    </div>
  </div>
);
