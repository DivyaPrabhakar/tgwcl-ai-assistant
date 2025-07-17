// pages/DashboardPage.js
import React from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { ChartsGrid } from "../components/dashboard/ChartsGrid";

export const DashboardPage = ({ demo }) => {
  const { analytics, loading, error } = useAnalytics();

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <StatsGrid analytics={analytics} />
      <ChartsGrid analytics={analytics} />
    </div>
  );
};
