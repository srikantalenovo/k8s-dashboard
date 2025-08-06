import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const SummaryCard = ({ title, count, icon, onClick, isExpanded }) => {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:scale-105 border-2 ${
        isExpanded ? "border-blue-400 bg-blue-900" : "border-gray-700 bg-gray-800"
      }`}
    >
      <CardContent className="p-4 flex flex-col items-start space-y-2">
        <div className="text-xl">{icon}</div>
        <div className="text-sm text-gray-300 font-semibold">{title}</div>
        <div className="text-2xl font-bold text-white">{count}</div>
        <div className="text-xs text-blue-300">
          {isExpanded ? "Click to collapse" : "Click to expand"}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
