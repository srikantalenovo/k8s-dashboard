import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';
import { Metrics } from '@kubernetes/client-node/dist/metrics';

const kc = new KubeConfig();
process.env.NODE_ENV === 'production' 
  ? kc.loadFromCluster() 
  : kc.loadFromDefault();

const coreApi = kc.makeApiClient(CoreV1Api);
const appsApi = kc.makeApiClient(AppsV1Api);
const metricsClient = new Metrics(kc);

export const getNodes = async (req, res) => {
  try {
    const { body: { items } } = await coreApi.listNode();
    res.json(items.map(node => ({
      name: node.metadata.name,
      status: node.status.conditions.find(c => c.type === 'Ready').status,
      cpu: node.status.capacity?.cpu,
      memory: node.status.capacity?.memory,
      pods: node.status.allocatable?.pods
    })));
  } catch (err) {
    logger.error('Node fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

export const getPods = async (req, res) => {
  try {
    const { namespace } = req.params;
    const response = namespace 
      ? await coreApi.listNamespacedPod(namespace)
      : await coreApi.listPodForAllNamespaces();
    
    res.json(response.body.items.map(pod => ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      status: pod.status.phase,
      node: pod.spec.nodeName,
      ip: pod.status.podIP,
      createdAt: pod.metadata.creationTimestamp
    })));
  } catch (err) {
    logger.error('Pod fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch pods' });
  }
};

export const getPodMetrics = async (req, res) => {
  const { namespace, name } = req.params;
  try {
    const metrics = await metricsClient.getPodMetrics(namespace, name);
    res.json({
      cpu: metrics.containers[0]?.usage?.cpu || 'N/A',
      memory: metrics.containers[0]?.usage?.memory || 'N/A'
    });
  } catch (err) {
    logger.error(`Metrics fetch failed for ${namespace}/${name}`, err);
    res.status(500).json({ error: 'Metrics unavailable' });
  }
};

// Add this new function
export const getDeployments = async (req, res) => {
  try {
    const { namespace } = req.params;
    const response = namespace
      ? await appsApi.listNamespacedDeployment(namespace)
      : await appsApi.listDeploymentForAllNamespaces();

    res.json(response.body.items.map(deployment => ({
      name: deployment.metadata.name,
      namespace: deployment.metadata.namespace,
      replicas: deployment.status.replicas || 0,
      available: deployment.status.availableReplicas || 0,
      createdAt: deployment.metadata.creationTimestamp
    })));
  } catch (err) {
    console.error('Deployment fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
};

// Namespace Controller
export const getNamespaces = async (req, res) => {
  try {
    const response = await coreApi.listNamespace();
    res.json(response.body.items.map(ns => ({
      name: ns.metadata.name,
      status: ns.status.phase,
      createdAt: ns.metadata.creationTimestamp,
      labels: ns.metadata.labels || {}
    })));
  } catch (err) {
    console.error('Namespace fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch namespaces' });
  }
};


