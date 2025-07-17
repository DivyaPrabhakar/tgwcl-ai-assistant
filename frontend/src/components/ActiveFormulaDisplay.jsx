import React from "react";
import { Settings, CheckCircle } from "lucide-react";

const ActiveFormulaDisplay = ({ activeStatusesConfig, isVisible }) => {
  if (!isVisible || !activeStatusesConfig) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
      <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <Settings size={16} />
        Active Items Formula:
      </h4>
      <p className="text-sm text-blue-700 mb-3">
        <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">
          {activeStatusesConfig.formula?.formula}
        </code>
      </p>
      <div className="text-sm text-blue-600">
        <p className="font-medium mb-2">Statuses included as "active":</p>
        <div className="flex flex-wrap gap-1">
          {activeStatusesConfig.activeStatuses?.map((status) => (
            <span
              key={status}
              className="inline-flex items-center px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium"
            >
              <CheckCircle size={12} className="mr-1" />
              {status}
            </span>
          ))}
        </div>
        <p className="text-xs mt-2 italic">
          {activeStatusesConfig.formula?.explanation}
        </p>
      </div>
    </div>
  );
};

export default ActiveFormulaDisplay;
