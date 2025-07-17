// hooks/useCostAnalysis.js - Cost analysis data fetching
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../App";

export const useCostAnalysis = () => {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCostAnalysis = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/wardrobe/cost-analysis`
        );
        const data = await response.json();
        setCostData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCostAnalysis();
  }, []);

  return { costData, loading, error };
};
