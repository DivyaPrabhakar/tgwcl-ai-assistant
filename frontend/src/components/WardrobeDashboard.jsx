import React, { useEffect } from "react";

// Custom hooks
import {
  useDashboardData,
  useStatusFilter,
  useUIState,
} from "../hooks/useWardrobe";

// Components
import DashboardHeader from "./DashboardHeader";
import SummaryStats from "./SummaryStats";
import StatusFilter from "./StatusFilter";
import StatusBreakdown from "./StatusBreakdown";
import FilteredItemsDisplay from "./FilteredItemsDisplay";
import AnalyticsSection from "./AnalyticsSection";
import { LoadingState, ErrorState } from "./LoadingErrorStates";

const WardrobeDashboard = () => {
  const { data, fetchDashboardData, refetch } = useDashboardData();
  const statusFilter = useStatusFilter(data.statuses);
  const {
    showActiveFormula,
    showStatusBreakdown,
    toggleActiveFormula,
    toggleStatusBreakdown,
  } = useUIState();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!data.loading) {
        fetchDashboardData(false);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [data.loading, fetchDashboardData]);

  // Handle loading state
  if (data.loading) {
    return <LoadingState />;
  }

  // Handle error state
  if (data.error) {
    return (
      <ErrorState error={data.error} onRetry={() => fetchDashboardData(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <DashboardHeader
          onRefresh={refetch}
          isLoading={data.loading}
          lastFetched={data.lastFetched}
        />

        {/* Summary Statistics */}
        <SummaryStats
          data={data}
          showActiveFormula={showActiveFormula}
          onToggleActiveFormula={toggleActiveFormula}
        />

        {/* Status Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatusFilter
            statusesData={data.statuses}
            statusFilter={statusFilter}
          />
          <StatusBreakdown
            analytics={data.analytics}
            statusesData={data.statuses}
            isVisible={showStatusBreakdown}
            onToggleVisibility={toggleStatusBreakdown}
          />
        </div>

        {/* Filtered Items Results */}
        <FilteredItemsDisplay
          filteredItems={statusFilter.filteredItems}
          selectedStatuses={statusFilter.selectedStatuses}
          filterLoading={statusFilter.filterLoading}
          activeStatuses={statusFilter.activeStatuses}
        />

        {/* Analytics Insights */}
        <AnalyticsSection analytics={data.analytics} />

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
};

// Simple footer component
const DashboardFooter = () => (
  <div className="mt-12 text-center text-sm text-gray-500">
    <p>Wardrobe AI Dashboard v2.0 • Status-based filtering enabled</p>
  </div>
);

export default WardrobeDashboard;
