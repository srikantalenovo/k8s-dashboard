// src/pages/AnalyzerView/HealthSummary/index.js
import React from "react";
import ResourceTable from "./ResourceTable";
import useHealthData from "./useHealthData";
import { Loader2 } from "lucide-react";

const HealthSummary = () => {
  const {
    crashLoopPods,
    failedJobs,
    notReadyNodes,
    unhealthyDeployments,
    loading,
    error,
  } = useHealthData();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Cluster Health Summary</h1>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin w-5 h-5" />
          Loading cluster health data...
        </div>
      )}

      {error && (
        <div className="text-red-600 mb-4">
          ⚠️ Failed to load data: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <ResourceTable
            title="CrashLoopBackOff Pods"
            items={crashLoopPods}
            type="pod"
          />

          <ResourceTable
            title="Failed Jobs"
            items={failedJobs}
            type="job"
          />

          <ResourceTable
            title="NotReady Nodes"
            items={notReadyNodes}
            type="node"
          />

          <ResourceTable
            title="Unhealthy Deployments"
            items={unhealthyDeployments}
            type="deployment"
          />
        </>
      )}
    </div>
  );
};

export default HealthSummary;
