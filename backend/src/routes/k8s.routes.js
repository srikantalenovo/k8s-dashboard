import express from 'express';
import { authorize } from '../middleware/rbac.js';
import k8sService from '../services/k8s.service.js';

const router = express.Router();

// ======================
// Cluster & Namespace APIs
// ======================

// Get cluster info
router.get('/cluster-info', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const data = await k8sService.getClusterInfo();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get all namespaces
router.get('/namespaces', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const namespaces = await k8sService.getNamespaces();
    res.json(namespaces);
  } catch (err) {
    next(err);
  }
});

// ======================
// Core Resources
// ======================

// Get pods in a namespace
router.get('/pods', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const pods = await k8sService.getPods(namespace);
    res.json(pods);
  } catch (err) {
    next(err);
  }
});

// Get nodes
router.get('/nodes', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const nodes = await k8sService.getNodes();
    res.json(nodes);
  } catch (err) {
    next(err);
  }
});

// Get services
router.get('/services', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const services = await k8sService.getServices();
    res.json(services);
  } catch (err) {
    next(err);
  }
});

// Get configmaps
router.get('/configmaps', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const configmaps = await k8sService.getConfigMaps();
    res.json(configmaps);
  } catch (err) {
    next(err);
  }
});

// Get secrets
router.get('/secrets', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const secrets = await k8sService.getSecrets();
    res.json(secrets);
  } catch (err) {
    next(err);
  }
});

// Get PVs
router.get('/persistentvolumes', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const pvs = await k8sService.getPersistentVolumes();
    res.json(pvs);
  } catch (err) {
    next(err);
  }
});

// Get PVCs
router.get('/persistentvolumeclaims', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const pvcs = await k8sService.getPersistentVolumeClaims();
    res.json(pvcs);
  } catch (err) {
    next(err);
  }
});

// ======================
// Workload APIs
// ======================

// Get deployments
router.get('/deployments', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const deployments = await k8sService.getDeployments();
    res.json(deployments);
  } catch (err) {
    next(err);
  }
});

// Get statefulsets
router.get('/statefulsets', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const statefulsets = await k8sService.getStatefulSets();
    res.json(statefulsets);
  } catch (err) {
    next(err);
  }
});

// Get daemonsets
router.get('/daemonsets', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const daemonsets = await k8sService.getDaemonSets();
    res.json(daemonsets);
  } catch (err) {
    next(err);
  }
});

// Get replicasets
router.get('/replicasets', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const replicasets = await k8sService.getReplicaSets();
    res.json(replicasets);
  } catch (err) {
    next(err);
  }
});

// ======================
// Networking APIs
// ======================

// Get ingresses
router.get('/ingresses', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const ingresses = await k8sService.getIngresses();
    res.json(ingresses);
  } catch (err) {
    next(err);
  }
});

// Get network policies
router.get('/networkpolicies', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const policies = await k8sService.getNetworkPolicies();
    res.json(policies);
  } catch (err) {
    next(err);
  }
});

// ======================
// Batch Jobs
// ======================

// Get jobs
router.get('/jobs', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const jobs = await k8sService.getJobs();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get cronjobs
router.get('/cronjobs', authorize(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const cronjobs = await k8sService.getCronJobs();
    res.json(cronjobs);
  } catch (err) {
    next(err);
  }
});

// ======================
// Pod Actions
// ======================

// Delete pod
router.delete('/pods/:name', authorize(['admin', 'editor']), async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.deletePod(req.params.name, namespace);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

// Restart pod
router.post('/pods/:name/restart', authorize(['admin', 'editor']), async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.restartPod(req.params.name, namespace);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

export default router;
