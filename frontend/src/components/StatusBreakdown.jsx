import React from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

const StatusBreakdown = ({
  analytics,
  statusesData,
  isVisible,
  onToggleVisibility,
}) => {
  if (!analytics?.statusBreakdown) return null;

  const totalItems = Object.values(analytics.statusBreakdown).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Status Breakdown
        </h3>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={isVisible ? "Hide breakdown" : "Show breakdown"}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-3">
          {Object.entries(analytics.statusBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => {
              const isActive =
                statusesData?.activeStatusesConfig?.activeStatuses?.includes(
                  status
                );
              const percentage = ((count / totalItems) * 100).toFixed(1);

              return (
                <div
                  key={status}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertCircle size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({percentage}%)
                      </span>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default StatusBreakdown;
