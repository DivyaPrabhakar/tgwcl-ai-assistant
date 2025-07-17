import React from "react";
import { Info } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "blue",
  onClick,
  helpContent,
  onToggleHelp,
}) => (
  <div
    className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
      onClick ? "cursor-pointer" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {helpContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleHelp?.();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={`Toggle help for ${title}`}
            >
              <Info size={16} />
            </button>
          )}
        </div>
        <p className={`text-2xl font-semibold text-${color}-600 mt-1`}>
          {value}
        </p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-${color}-100 rounded-full flex-shrink-0`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>

    {helpContent}
  </div>
);

export default StatCard;
