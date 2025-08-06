import React from "react";
import HealthSummary from "./HealthSummary";

const AnalyzerView = () => {
  return (
    <div className="flex h-full">
      {/* Sidebar (Optional Static Label) */}
      <div className="w-52 min-w-52 bg-gray-100 dark:bg-gray-800 p-4 border-r">
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        </div>
      </div>

      {/* Health Summary Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <HealthSummary />
      </div>
    </div>
  );
};

export default AnalyzerView;
