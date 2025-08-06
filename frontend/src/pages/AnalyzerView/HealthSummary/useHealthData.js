// src/pages/AnalyzerView/HealthSummary/useHealthData.js
import { useEffect, useState } from "react";

const useHealthData = (selectedNamespace) => {
  const [healthSummary, setHealthSummary] = useState({
    crashLoopPods: [],
    failedJobs: [],
    notReadyNodes: [],
    unhealthyDeployments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [podsRes, jobsRes, nodesRes, deploymentsRes] = await Promise.all([
        fetch(`/api/k8s/pods?namespace=${selectedNamespace}`),
        fetch(`/api/k8s/jobs?namespace=${selectedNamespace}`),
        fetch(`/api/k8s/nodes`), // Node is cluster-wide
        fetch(`/api/k8s/deployments?namespace=${selectedNamespace}`),
      ]);

      const [podsData, jobsData, nodesData, deploymentsData] = await Promise.all([
        podsRes.json(),
        jobsRes.json(),
        nodesRes.json(),
        deploymentsRes.json(),
      ]);

      // CrashLoopBackOff pods
      const crashLoopPods = podsData.items?.filter(pod =>
        pod.status?.containerStatuses?.some(cs => cs.state?.waiting?.reason === "CrashLoopBackOff")
      ) || [];

      // Failed jobs
      const failedJobs = jobsData.items?.filter(job =>
        job.status?.failed > 0
      ) || [];

      // NotReady nodes
      const notReadyNodes = nodesData.items?.filter(node =>
        node.status?.conditions?.some(
          cond => cond.type === "Ready" && cond.status !== "True"
        )
      ) || [];

      // Unhealthy deployments (zero replicas or failing probe indicators)
      const unhealthyDeployments = deploymentsData.items?.filter(deploy =>
        deploy.status?.readyReplicas === 0 || deploy.status?.unavailableReplicas > 0
      ) || [];

      setHealthSummary({
        crashLoopPods,
        failedJobs,
        notReadyNodes,
        unhealthyDeployments,
      });
    } catch (err) {
      console.error("Error fetching health data:", err);
      setError("Failed to fetch health summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNamespace) fetchData();
  }, [selectedNamespace]);

  return { ...healthSummary, loading, error };
};

export default useHealthData;
