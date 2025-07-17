// pages/CostAnalysisPage.js - Modular version using components
import React from "react";
import { useCostAnalysis } from "../hooks/useCostAnalysis";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { CostOverview } from "../components/cost/CostOverview";
import { ValueAnalysis } from "../components/cost/ValueAnalysis";
import { CategoryBreakdown } from "../components/cost/CategoryBreakdown";
import { AlertCircle, Eye } from "lucide-react";

export const CostAnalysisPage = ({ demo }) => {
  const { costData, loading, error } = useCostAnalysis();

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
        <p className="text-red-600">Error: {error}</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost Analysis</h1>
        <p className="text-gray-600">
          Understand your wardrobe investment, cost-per-wear efficiency, and
          spending patterns.
        </p>
      </div>

      {/* Cost Overview Section */}
      <CostOverview costData={costData} />

      {/* Value Analysis Section */}
      <ValueAnalysis costData={costData} />

      {/* Category Breakdown Section */}
      <CategoryBreakdown costData={costData} />

      {/* Demo Mode Banner */}
      {demo.isDemo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Demo Mode</p>
              <p className="text-blue-700 text-sm mt-1">
                This cost analysis is based on real wardrobe data. In the full
                version, you could ask the AI for personalized recommendations
                about improving your cost-per-wear ratios and making smarter
                purchasing decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
