// src/App.js - Refactored for modularity and maintainability
import { useState } from "react";
import { Shirt, Lock, RefreshCw } from "lucide-react";

// Import components
import { useDemo } from "./hooks/useDemo";
import { Navigation } from "./components/Navigation";
import { DemoHeader } from "./components/DemoHeader";
import { Footer } from "./components/Footer";
import { LoadingSpinner } from "./components/LoadingSpinner";

// Import page components
import { DashboardPage } from "./pages/DashboardPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CostAnalysisPage } from "./pages/CostAnalysisPage";
import { ChatPage } from "./pages/ChatPage";

// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tgwcl-ai-assistant-production.up.railway.app");

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const demo = useDemo();

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API_BASE_URL}/api/clear-cache`, { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", component: DashboardPage },
    { id: "analytics", label: "Analytics", component: AnalyticsPage },
    { id: "costs", label: "Cost Analysis", component: CostAnalysisPage },
    {
      id: "chat",
      label: demo.isDemo ? "Chat Demo" : "AI Chat",
      component: ChatPage,
    },
  ];

  if (demo.loading) {
    return <LoadingSpinner fullScreen />;
  }

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || DashboardPage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Header */}
      {demo.isDemo && <DemoHeader demo={demo} />}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shirt className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Wardrobe AI{" "}
                  {demo.isDemo && <span className="text-blue-600">(Demo)</span>}
                </h1>
                <p className="text-sm text-gray-500">
                  {demo.isDemo
                    ? "Public demonstration of personal wardrobe analytics"
                    : "Your personal wardrobe assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {!demo.isDemo && (
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              )}

              {demo.isDemo && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Demo Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demo={demo}
      />

      {/* Main Content */}
      <main className="py-6">
        <ActiveComponent demo={demo} />
      </main>

      {/* Footer */}
      <Footer demo={demo} />
    </div>
  );
}

export default App;
