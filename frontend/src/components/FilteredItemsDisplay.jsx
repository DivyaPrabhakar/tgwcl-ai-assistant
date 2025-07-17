import React from "react";
import { RefreshCw, Package } from "lucide-react";

const FilteredItemsDisplay = ({
  filteredItems,
  selectedStatuses,
  filterLoading,
  activeStatuses,
}) => {
  if (selectedStatuses.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Items: {selectedStatuses.join(", ")}
        </h3>
        {filterLoading && (
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {filterLoading ? (
        <LoadingState />
      ) : filteredItems.length > 0 ? (
        <ItemsGrid items={filteredItems} activeStatuses={activeStatuses} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="text-center py-8">
    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
    <p className="text-gray-600">Loading filtered items...</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8">
    <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
    <p className="text-gray-600">
      No items found with the selected status filters.
    </p>
  </div>
);

const ItemsGrid = ({ items, activeStatuses }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.slice(0, 12).map((item, index) => (
        <ItemCard
          key={item.id || index}
          item={item}
          activeStatuses={activeStatuses}
        />
      ))}
    </div>
    {items.length > 12 && (
      <p className="text-sm text-gray-500 mt-4 text-center">
        Showing first 12 of {items.length} items
      </p>
    )}
  </>
);

const ItemCard = ({ item, activeStatuses }) => (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
    <h4 className="font-medium text-gray-900 truncate">
      {item.Name || "Unnamed Item"}
    </h4>
    <p className="text-sm text-gray-600 mt-1">
      {item.Category || "No category"}
    </p>
    <div className="flex items-center justify-between mt-3">
      <span className="text-xs text-gray-500">{item.Brand || "No brand"}</span>
      <span
        className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${
          activeStatuses?.includes(item.Status)
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }
      `}
      >
        {item.Status || "No status"}
      </span>
    </div>
  </div>
);

export default FilteredItemsDisplay;
