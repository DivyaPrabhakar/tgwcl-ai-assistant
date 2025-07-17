import React from "react";
import { Filter, CheckCircle } from "lucide-react";

const StatusFilter = ({ statusesData, statusFilter }) => {
  const { selectedStatuses, activeStatuses, toggleStatus, clearFilters } =
    statusFilter;

  if (!statusesData?.allStatuses) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Filter by Status
          </h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={selectedStatuses.length === 0}
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusesData.allStatuses.map((status) => {
          const isSelected = selectedStatuses.includes(status);
          const isActive = activeStatuses.includes(status);

          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`
                inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? "bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-sm"
                    : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200 hover:shadow-sm"
                }
              `}
              aria-pressed={isSelected}
            >
              {isActive && (
                <CheckCircle size={14} className="mr-1 text-green-600" />
              )}
              {status}
            </button>
          );
        })}
      </div>

      {selectedStatuses.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Filtering by:{" "}
            <span className="font-medium">{selectedStatuses.join(", ")}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusFilter;
