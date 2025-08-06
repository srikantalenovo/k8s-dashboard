// src/pages/AnalyzerView/HealthSummary/useHealthData.js

import { useEffect, useState } from 'react';

export default function useHealthData() {
  const [unhealthyPods, setUnhealthyPods] = useState([]);
  const [failedJobs, setFailedJobs] = useState([]);
  const [notReadyNodes, setNotReadyNodes] = useState([]);
  const [unhealthyDeployments, setUnhealthyDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ns = localStorage.getItem('selectedNamespace') || 'default';

        const [podsRes, jobsRes, nodesRes, deploymentsRes] = await Promise.all([
          fetch(`/api/k8s/pods?namespace=${ns}`),
          fetch(`/api/k8s/jobs?namespace=${ns}`),
          fetch(`/api/k8s/nodes`),
          fetch(`/api/k8s/deployments?namespace=${ns}`),
        ]);

        const [pods, jobs, nodes, deployments] = await Promise.all([
          podsRes.json(),
          jobsRes.json(),
          nodesRes.json(),
          deploymentsRes.json(),
        ]);

        setUnhealthyPods(pods.items.filter(p => p.status.phase === 'Running' && p.status.containerStatuses?.some(c => c.state?.waiting?.reason === 'CrashLoopBackOff')).map(p => ({
          name: p.metadata.name,
          namespace: p.metadata.namespace,
          status: 'CrashLoopBackOff',
        })));

        setFailedJobs(jobs.items.filter(j => j.status.failed > 0).map(j => ({
          name: j.metadata.name,
          namespace: j.metadata.namespace,
          status: `Failed (${j.status.failed})`,
        })));

        setNotReadyNodes(nodes.items.filter(n => n.status.conditions?.some(c => c.type === 'Ready' && c.status !== 'True')).map(n => ({
          name: n.metadata.name,
          status: 'NotReady',
        })));

        setUnhealthyDeployments(deployments.items.filter(d =>
          d.status.replicas === 0 ||
          d.status.readyReplicas < d.status.replicas
        ).map(d => ({
          name: d.metadata.name,
          namespace: d.metadata.namespace,
          status: 'Unhealthy',
        })));

        setLoading(false);
      } catch (err) {
        setError('Error fetching health data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    unhealthyPods,
    failedJobs,
    notReadyNodes,
    unhealthyDeployments,
    loading,
    error,
  };
}
