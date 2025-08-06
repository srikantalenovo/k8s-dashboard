import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import ResourceTable from "./ResourceTable";
import { fetchHealthSummary } from "../../../services/api";

const HealthSummary = () => {
  const [healthData, setHealthData] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const res = await fetchHealthSummary();
      setHealthData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching health summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  const cards = [
    {
      title: "CrashLoopBackOff Pods",
      key: "crashLoopBackOffPods",
      count: healthData.crashLoopBackOffPods?.length || 0,
      icon: "💥",
    },
    {
      title: "Failed Jobs",
      key: "failedJobs",
      count: healthData.failedJobs?.length || 0,
      icon: "❌",
    },
    {
      title: "NotReady Nodes",
      key: "notReadyNodes",
      count: healthData.notReadyNodes?.length || 0,
      icon: "🖥️",
    },
    {
      title: "Unhealthy Deployments",
      key: "unhealthyDeployments",
      count: healthData.unhealthyDeployments?.length || 0,
      icon: "⚠️",
    },
  ];

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Cluster Health Summary</h2>
      {loading && <div className="text-sm text-gray-300 mb-4">Loading health data...</div>}
      {!loading && (
        <div className="text-sm text-gray-400 mb-4">
          Last Updated: {lastUpdated}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ title, count, key, icon }) => (
          <SummaryCard
            key={key}
            title={title}
            count={count}
            icon={icon}
            isExpanded={expanded === key}
            onClick={() => toggleExpand(key)}
          />
        ))}
      </div>

      {expanded && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {cards.find((c) => c.key === expanded)?.title} Details
          </h3>
          <ResourceTable data={healthData[expanded]} type={expanded} />
        </div>
      )}
    </div>
  );
};

export default HealthSummary;
