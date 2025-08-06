// src/pages/AnalyzerView/HealthSummary/index.js

import React from 'react';
import SummaryCard from './SummaryCard';
import ResourceTable from './ResourceTable';
import useHealthData from './useHealthData';

export default function HealthSummary() {
  const {
    unhealthyPods,
    failedJobs,
    notReadyNodes,
    unhealthyDeployments,
    loading,
    error,
  } = useHealthData();

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Cluster Health Summary</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <SummaryCard title="CrashLoopBackOff Pods" count={unhealthyPods.length} color="orange" />
            <SummaryCard title="Failed Jobs" count={failedJobs.length} color="red" />
            <SummaryCard title="NotReady Nodes" count={notReadyNodes.length} color="gray" />
            <SummaryCard title="Unhealthy Deployments" count={unhealthyDeployments.length} color="purple" />
          </div>

          <ResourceTable title="CrashLoopBackOff Pods" data={unhealthyPods} type="pods" />
          <ResourceTable title="Failed Jobs" data={failedJobs} type="jobs" />
          <ResourceTable title="NotReady Nodes" data={notReadyNodes} type="nodes" />
          <ResourceTable title="Unhealthy Deployments" data={unhealthyDeployments} type="deployments" />
        </>
      )}
    </div>
  );
}
