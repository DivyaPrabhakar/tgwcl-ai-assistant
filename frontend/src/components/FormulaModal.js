// src/components/FormulaModal.js
import React from "react";
import { X } from "lucide-react";

const FormulaModal = ({ formula, onClose }) => {
  if (!formula) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {formula.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{formula.description}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Formula</h3>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                {formula.formula}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Explanation</h3>
              <p className="text-gray-600">{formula.explanation}</p>
            </div>

            {formula.statusesIncluded && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Statuses Included
                </h3>
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  {formula.statusesIncluded.join(", ")}
                </div>
              </div>
            )}

            {formula.excludedSources && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Excluded Sources
                </h3>
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  {formula.excludedSources}
                </div>
              </div>
            )}

            {formula.gradeScale && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Grade Scale</h3>
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  {formula.gradeScale}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Source</h3>
              <p className="text-gray-600 text-sm">{formula.dataSource}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Last Updated</h3>
              <p className="text-gray-600 text-sm">{formula.lastUpdated}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaModal;
