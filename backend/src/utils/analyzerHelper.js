// backend/utils/analyzerHelper.js

import k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCore = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiApps = kc.makeApiClient(k8s.AppsV1Api);
const k8sApiBatch = kc.makeApiClient(k8s.BatchV1Api);

export async function getClusterHealthSummary() {
  const [pods, nodes, jobs, deployments] = await Promise.all([
    k8sApiCore.listPodForAllNamespaces(),
    k8sApiCore.listNode(),
    k8sApiBatch.listJobForAllNamespaces(),
    k8sApiApps.listDeploymentForAllNamespaces(),
  ]);

  const crashLoopBackOffPods = pods.body.items.filter(pod =>
    pod.status?.containerStatuses?.some(
      cs => cs.state?.waiting?.reason === 'CrashLoopBackOff'
    )
  );

  const failedJobs = jobs.body.items.filter(job =>
    job.status.failed > 0
  );

  const notReadyNodes = nodes.body.items.filter(node =>
    !node.status.conditions.some(
      c => c.type === 'Ready' && c.status === 'True'
    )
  );

  const unhealthyDeployments = deployments.body.items.filter(dep =>
    dep.status.readyReplicas === 0 || dep.status.replicas === 0
  );

  return {
    crashLoopBackOffPods: crashLoopBackOffPods.map(p => ({
      name: p.metadata.name,
      namespace: p.metadata.namespace,
      reason: 'CrashLoopBackOff',
    })),
    failedJobs: failedJobs.map(j => ({
      name: j.metadata.name,
      namespace: j.metadata.namespace,
      failed: j.status.failed,
    })),
    notReadyNodes: notReadyNodes.map(n => ({
      name: n.metadata.name,
      status: 'NotReady',
    })),
    unhealthyDeployments: unhealthyDeployments.map(d => ({
      name: d.metadata.name,
      namespace: d.metadata.namespace,
      replicas: d.status.replicas || 0,
      readyReplicas: d.status.readyReplicas || 0,
    })),
  };
}
