import express from 'express';
import { authorize } from '../middleware/rbac.js';
import k8sService from '../services/k8s.service.js';

const router = express.Router();

// Helper middleware to disable caching
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

// ======================
// Cluster & Namespace APIs
// ======================

router.get('/cluster-info', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const data = await k8sService.getClusterInfo();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/namespaces', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
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

router.get('/pods', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const pods = await k8sService.getPods(namespace);
    res.json(pods);
  } catch (err) {
    next(err);
  }
});

router.get('/nodes', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const nodes = await k8sService.getNodes();
    res.json(nodes);
  } catch (err) {
    next(err);
  }
});

router.get('/services', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const services = await k8sService.getServices(namespace);
    res.json(services);
  } catch (err) {
    next(err);
  }
});

router.get('/configmaps', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const configmaps = await k8sService.getConfigMaps(namespace);
    res.json(configmaps);
  } catch (err) {
    next(err);
  }
});

router.get('/secrets', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const secrets = await k8sService.getSecrets(namespace);
    res.json(secrets);
  } catch (err) {
    next(err);
  }
});

router.get('/persistentvolumes', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const pvs = await k8sService.getPersistentVolumes();
    res.json(pvs);
  } catch (err) {
    next(err);
  }
});

router.get('/persistentvolumeclaims', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const pvcs = await k8sService.getPersistentVolumeClaims(namespace);
    res.json(pvcs);
  } catch (err) {
    next(err);
  }
});

// ======================
// Workload APIs
// ======================

router.get('/deployments', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const deployments = await k8sService.getDeployments(namespace);
    res.json(deployments);
  } catch (err) {
    next(err);
  }
});

router.get('/statefulsets', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const statefulsets = await k8sService.getStatefulSets(namespace);
    res.json(statefulsets);
  } catch (err) {
    next(err);
  }
});

router.get('/daemonsets', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const daemonsets = await k8sService.getDaemonSets(namespace);
    res.json(daemonsets);
  } catch (err) {
    next(err);
  }
});

router.get('/replicasets', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const replicasets = await k8sService.getReplicaSets(namespace);
    res.json(replicasets);
  } catch (err) {
    next(err);
  }
});

// ======================
// Networking APIs
// ======================

router.get('/ingresses', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const ingresses = await k8sService.getIngresses(namespace);
    res.json(ingresses);
  } catch (err) {
    next(err);
  }
});

router.get('/networkpolicies', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const policies = await k8sService.getNetworkPolicies(namespace);
    res.json(policies);
  } catch (err) {
    next(err);
  }
});

// ======================
// Batch Jobs
// ======================

router.get('/jobs', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const jobs = await k8sService.getJobs(namespace);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

router.get('/cronjobs', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const cronjobs = await k8sService.getCronJobs(namespace);
    res.json(cronjobs);
  } catch (err) {
    next(err);
  }
});

// ======================
// Pod Actions
// ======================

router.delete('/pods/:name', authorize(['admin', 'editor']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.deletePod(req.params.name, namespace);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post('/pods/:name/restart', authorize(['admin', 'editor']), noCache, async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.restartPod(req.params.name, namespace);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});



// Analyzer Health Summary Route
// --------------------------------------------
import express from 'express';
import { getClusterHealthSummary } from '../utils/analyzerHelper.js';

router.get('/analyzer/health-summary', async (req, res) => {
  try {
    const summary = await getClusterHealthSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error in /analyzer/health-summary:', error);
    res.status(500).json({ error: 'Failed to get cluster health summary' });
  }
});

export default router;