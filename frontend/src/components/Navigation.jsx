// components/Navigation.js
import React from "react";
import { Lock } from "lucide-react";

export const Navigation = ({ tabs, activeTab, setActiveTab, demo }) => (
  <nav className="bg-white border-b">
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {tab.id === "chat" && demo.isDemo && (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  </nav>
);
