// src/pages/AnalyzerView/HealthSummary/SummaryCard.js

import React from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

const SummaryCard = ({ title, count, isOpen, onClick }) => {
  const getColor = () => {
    if (title.includes("CrashLoop")) return "bg-red-500";
    if (title.includes("Failed")) return "bg-yellow-500";
    if (title.includes("NotReady")) return "bg-orange-500";
    if (title.includes("Unhealthy")) return "bg-pink-500";
    return "bg-blue-500";
  };

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-5 mb-6 transition hover:shadow-2xl hover:scale-[1.015]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${getColor()} bg-opacity-80`}>
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">{title}</h3>
            <p className="text-white text-2xl font-extrabold">{count}</p>
          </div>
        </div>
        {count > 0 && (
          <div className="text-white">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </div>
        )}
      </div>

      {/* Gradient ring on hover */}
      <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-sm transition" />
    </div>
  );
};

export default SummaryCard;

