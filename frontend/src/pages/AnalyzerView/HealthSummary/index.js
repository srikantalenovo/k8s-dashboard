import React, { useState, useEffect } from "react";
import SummaryCard from "./SummaryCard";
import ResourceTable from "./ResourceTable";
import { fetchHealthSummary } from "../../../services/api";

const categories = [
  { key: "crashLoopBackOffPods", title: "CrashLoopBackOff Pods" },
  { key: "failedJobs", title: "Failed Jobs" },
  { key: "notReadyNodes", title: "NotReady Nodes" },
  { key: "unhealthyDeployments", title: "Unhealthy Deployments" },
];

const HealthSummary = () => {
  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealthData = async () => {
    setIsRefreshing(true);
    try {
      const summary = await fetchHealthSummary();
      setHealthData(summary);
    } catch (error) {
      console.error("Failed to fetch health summary:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(() => {
      loadHealthData();
    }, 60000); // refresh every 60 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const handleCardClick = (key) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600 text-lg">Loading cluster health data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Cluster Health Summary</h2>
        {isRefreshing && (
          <span className="text-sm text-blue-500 animate-pulse">Refreshing...</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(({ key, title }) => (
          <SummaryCard
            key={key}
            title={title}
            count={healthData[key]?.length || 0}
            iconKey={key}
            isSelected={selectedCategory === key}
            onClick={() => handleCardClick(key)}
          />
        ))}
      </div>

      {selectedCategory && (
        <div className="transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            {categories.find((c) => c.key === selectedCategory).title} Details
          </h3>
          <ResourceTable resources={healthData[selectedCategory]} />
        </div>
      )}
    </div>
  );
};

export default HealthSummary;
