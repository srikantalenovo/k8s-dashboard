import React from "react";
import { AlertCircle, ArrowDown, ArrowUp } from "lucide-react";

const iconMap = {
  crashLoopBackOffPods: <AlertCircle className="text-red-500" />,
  failedJobs: <AlertCircle className="text-orange-500" />,
  notReadyNodes: <AlertCircle className="text-yellow-500" />,
  unhealthyDeployments: <AlertCircle className="text-pink-500" />,
};

const SummaryCard = ({ title, count, iconKey, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer border rounded-2xl p-5 shadow-md bg-white hover:shadow-lg transition-all duration-200 ${
        isSelected ? "border-blue-500" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {iconMap[iconKey]}
          <div>
            <h4 className="text-md font-semibold text-gray-700">{title}</h4>
            <p className="text-lg font-bold text-blue-600">{count}</p>
          </div>
        </div>
        {isSelected ? <ArrowUp className="text-blue-500" /> : <ArrowDown className="text-gray-400" />}
      </div>
    </div>
  );
};

export default SummaryCard;
