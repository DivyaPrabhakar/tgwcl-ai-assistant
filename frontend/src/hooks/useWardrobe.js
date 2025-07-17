// hooks/useWardrobe.js - Custom hooks for wardrobe functionality
import { useState, useEffect, useCallback, useMemo } from "react";

// Custom hook for API calls with better error handling
export const useWardrobeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine the correct API base URL
  const getApiBaseUrl = () => {
    // Check if we're in development
    if (process.env.NODE_ENV === "development") {
      return process.env.REACT_APP_API_URL || "http://localhost:3001";
    }
    // In production, assume API is on same domain or use env variable
    return process.env.REACT_APP_API_URL || "";
  };

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const fullUrl = `${baseUrl}${endpoint}`;

      console.log("🔗 Making API call to:", fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.text();
          if (errorData.startsWith("<!DOCTYPE")) {
            errorMessage = `Server returned HTML instead of JSON. Check if API server is running on correct port.`;
          } else {
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage =
                jsonError.error || jsonError.message || errorMessage;
            } catch {
              errorMessage = `API Error: ${
                response.status
              } - ${errorData.substring(0, 100)}`;
            }
          }
        } catch {
          // If we can't read the response, use the original error
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.startsWith("<!DOCTYPE")) {
          throw new Error(
            "Server returned HTML page instead of JSON. API server may not be running or endpoint not found."
          );
        }
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      console.log("✅ API call successful");
      return data;
    } catch (err) {
      console.error("❌ API call failed:", err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
};

// Custom hook for dashboard data with better debugging
export const useDashboardData = () => {
  const [data, setData] = useState({
    analytics: null,
    costAnalysis: null,
    activeItems: null,
    statuses: null,
    loading: true,
    error: null,
    lastFetched: null,
  });

  const { apiCall } = useWardrobeAPI();

  const fetchDashboardData = useCallback(
    async (forceRefresh = false) => {
      console.log("🔄 Starting dashboard data fetch...");
      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const refreshParam = forceRefresh ? "?refresh=true" : "";

        console.log("📊 Fetching dashboard data with refresh:", forceRefresh);

        // Test API connectivity first
        try {
          console.log("🏥 Testing API health...");
          await apiCall("/api/health");
          console.log("✅ API health check passed");
        } catch (healthError) {
          console.error("❌ API health check failed:", healthError.message);
          throw new Error(`API server not responding: ${healthError.message}`);
        }

        // Fetch all data
        console.log("📡 Fetching all dashboard endpoints...");
        const [analyticsRes, costRes, activeItemsRes, statusesRes] =
          await Promise.all([
            apiCall(`/api/wardrobe/analytics${refreshParam}`).catch((err) => {
              console.error("❌ Analytics fetch failed:", err.message);
              throw new Error(`Analytics: ${err.message}`);
            }),
            apiCall(`/api/wardrobe/cost-analysis${refreshParam}`).catch(
              (err) => {
                console.error("❌ Cost analysis fetch failed:", err.message);
                throw new Error(`Cost Analysis: ${err.message}`);
              }
            ),
            apiCall(`/api/wardrobe/active-items${refreshParam}`).catch(
              (err) => {
                console.error("❌ Active items fetch failed:", err.message);
                throw new Error(`Active Items: ${err.message}`);
              }
            ),
            apiCall(`/api/wardrobe/statuses${refreshParam}`).catch((err) => {
              console.error("❌ Statuses fetch failed:", err.message);
              throw new Error(`Statuses: ${err.message}`);
            }),
          ]);

        console.log("✅ All dashboard data fetched successfully");

        setData({
          analytics: analyticsRes,
          costAnalysis: costRes,
          activeItems: activeItemsRes,
          statuses: statusesRes,
          loading: false,
          error: null,
          lastFetched: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Dashboard data fetch failed:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load dashboard data",
        }));
      }
    },
    [apiCall]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refetch = useCallback(
    () => fetchDashboardData(true),
    [fetchDashboardData]
  );

  return { data, fetchDashboardData, refetch };
};

// Custom hook for status filtering
export const useStatusFilter = (statusesData) => {
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  const { apiCall } = useWardrobeAPI();

  const fetchFilteredItems = useCallback(
    async (statusList) => {
      if (statusList.length === 0) {
        setFilteredItems([]);
        return;
      }

      setFilterLoading(true);
      try {
        const response = await apiCall(
          `/api/wardrobe/items-by-status?statuses=${statusList.join(",")}`
        );
        setFilteredItems(response.items || []);
      } catch (error) {
        console.error("Failed to fetch filtered items:", error);
        setFilteredItems([]);
      } finally {
        setFilterLoading(false);
      }
    },
    [apiCall]
  );

  const toggleStatus = useCallback(
    (status) => {
      const updated = selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status];

      setSelectedStatuses(updated);
      fetchFilteredItems(updated);
    },
    [selectedStatuses, fetchFilteredItems]
  );

  const clearFilters = useCallback(() => {
    setSelectedStatuses([]);
    setFilteredItems([]);
  }, []);

  const activeStatuses = useMemo(() => {
    return statusesData?.activeStatusesConfig?.activeStatuses || [];
  }, [statusesData]);

  return {
    selectedStatuses,
    filteredItems,
    filterLoading,
    activeStatuses,
    toggleStatus,
    clearFilters,
  };
};

// Custom hook for UI state management
export const useUIState = () => {
  const [showActiveFormula, setShowActiveFormula] = useState(false);
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(true);

  const toggleActiveFormula = useCallback(() => {
    setShowActiveFormula((prev) => !prev);
  }, []);

  const toggleStatusBreakdown = useCallback(() => {
    setShowStatusBreakdown((prev) => !prev);
  }, []);

  return {
    showActiveFormula,
    showStatusBreakdown,
    toggleActiveFormula,
    toggleStatusBreakdown,
  };
};
