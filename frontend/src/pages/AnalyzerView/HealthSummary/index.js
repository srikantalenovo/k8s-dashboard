import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import ResourceTable from "./ResourceTable";
import "./styles.css"; // we'll define custom loader style here

const HealthSummary = ({ selectedNamespace }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch("/api/k8s/analyzer/health-summary");
        const data = await response.json();
        setHealthData(data);
      } catch (error) {
        console.error("Failed to fetch health summary:", error);
        setHealthData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [selectedNamespace]);

  if (loading) {
    return (
      <div className="health-loader-container">
        <div className="spinner" />
        <p className="loader-text">Loading cluster health data...</p>
      </div>
    );
  }

  if (!healthData) {
    return <p style={{ padding: "1rem", color: "red" }}>Failed to load data.</p>;
  }

  return (
    <div className="health-summary-container">
      <h2 className="summary-heading">Cluster Health Summary</h2>
      <div className="summary-card-grid">
        <SummaryCard title="CrashLoopBackOff Pods" count={healthData.crashLoopBackOffPods.length} />
        <SummaryCard title="Failed Jobs" count={healthData.failedJobs.length} />
        <SummaryCard title="NotReady Nodes" count={healthData.notReadyNodes.length} />
        <SummaryCard title="Unhealthy Deployments" count={healthData.unhealthyDeployments.length} />
      </div>

      <div className="table-section">
        <ResourceTable title="CrashLoopBackOff Pods" data={healthData.crashLoopBackOffPods} />
        <ResourceTable title="Failed Jobs" data={healthData.failedJobs} />
        <ResourceTable title="NotReady Nodes" data={healthData.notReadyNodes} />
        <ResourceTable title="Unhealthy Deployments" data={healthData.unhealthyDeployments} />
      </div>
    </div>
  );
};

export default HealthSummary;
