// hooks/useDemo.js - Demo mode detection and handling
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../App";

export const useDemo = () => {
  const [demoInfo, setDemoInfo] = useState({
    isDemo: false,
    features: {},
    user: {},
    message: "",
    loading: true,
  });

  useEffect(() => {
    const fetchDemoInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/demo/info`);
        const data = await response.json();

        setDemoInfo({
          isDemo: data.demoMode,
          features: data.features || {},
          user: data.user || {},
          message: data.message,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch demo info:", error);
        setDemoInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDemoInfo();
  }, []);

  return demoInfo;
};
