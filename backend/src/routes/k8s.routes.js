// routes/k8s.routes.js
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
    const data = await k8sService.getClusterInfo?.() ?? { message: 'getClusterInfo not implemented' };
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
    const replicasets = await k8sService.getReplicaSets?.(namespace) ?? [];
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
    const policies = await k8sService.getNetworkPolicies?.(namespace) ?? [];
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
// Pod Actions (existing)
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

// ======================
// Existing Pod logs
// ======================
router.get('/pods/:name/logs', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res) => {
  try {
    const { name } = req.params;
    const { namespace = 'default', tailLines = 100 } = req.query;
    res.setHeader('Content-Type', 'text/plain');
    const logStream = await k8sService.streamPodLogs(name, namespace, tailLines);
    // The client-node readNamespacedPodLog returns the log text when follow=false.
    // If returning a stream isn't supported by yours, this will still return a string.
    if (typeof logStream === 'string') {
      res.send(logStream);
    } else if (logStream && typeof logStream.pipe === 'function') {
      logStream.pipe(res);
    } else {
      res.json({ logs: logStream });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================
// Deployment Actions
// ======================
router.get('/deployments', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const { namespace } = req.query;
    const deployments = await k8sService.getDeployments(namespace || 'default');
    res.json(deployments);
  } catch (err) {
    next(err);
  }
});

router.patch('/deployments/:name/scale', authorize(['admin', 'editor']), noCache, async (req, res, next) => {
  try {
    const { name } = req.params;
    const { namespace, replicas } = req.body;
    await k8sService.scaleDeployment(name, namespace || 'default', replicas);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ======================
// Helm Release APIs (existing + new)
// ======================
router.get('/helm/releases', authorize(['admin', 'editor', 'viewer']), noCache, async (req, res, next) => {
  try {
    const { namespace } = req.query;
    const releases = await k8sService.listHelmReleases?.(namespace) ?? [];
    res.json(releases);
  } catch (err) {
    next(err);
  }
});

router.delete('/helm/releases/:name', authorize(['admin']), noCache, async (req, res, next) => {
  try {
    const { name } = req.params;
    const { namespace } = req.query;
    await k8sService.uninstallHelmRelease?.(name, namespace);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ======================
// NEW: Summary endpoints (healthSummary-style responses)
// ======================

router.get(
  '/pods/summary',
  authorize(['admin', 'editor', 'viewer']),
  noCache,
  async (req, res, next) => {
    try {
      const namespace = req.query.namespace || 'default';
      const status = req.query.status || null;
      const errorPodsOnly = req.query.errorPodsOnly === 'true';
      const sortBy = req.query.sortBy || null;
      const sortOrder = req.query.sortOrder || 'asc';
      const result = await k8sService.getPodsFormatted(namespace, { status, errorPodsOnly }, sortBy, sortOrder);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/deployments/summary',
  authorize(['admin', 'editor', 'viewer']),
  noCache,
  async (req, res, next) => {
    try {
      const namespace = req.query.namespace || 'default';
      const sortBy = req.query.sortBy || null;
      const sortOrder = req.query.sortOrder || 'asc';
      const result = await k8sService.getDeploymentsFormatted(namespace, sortBy, sortOrder);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/services/summary',
  authorize(['admin', 'editor', 'viewer']),
  noCache,
  async (req, res, next) => {
    try {
      const namespace = req.query.namespace || 'default';
      const sortBy = req.query.sortBy || null;
      const sortOrder = req.query.sortOrder || 'asc';
      const result = await k8sService.getServicesFormatted(namespace, sortBy, sortOrder);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Helm summary (native CLI)
router.get(
  '/helm/summary',
  authorize(['admin', 'editor', 'viewer']),
  noCache,
  async (req, res, next) => {
    try {
      const namespace = req.query.namespace || 'default';
      const sortBy = req.query.sortBy || null;
      const sortOrder = req.query.sortOrder || 'asc';
      const result = await k8sService.getHelmReleasesFormatted(namespace, sortBy, sortOrder);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ======================
// NEW: Helm action routes
// POST /api/.../helm/:release/upgrade
// POST /api/.../helm/:release/rollback
// DELETE /api/.../helm/:release
// ======================

router.post('/helm/:name/upgrade', authorize(['admin', 'editor']), noCache, async (req, res, next) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || req.body.namespace || 'default';
    // Expect body: { chart, valuesFile, additionalArgs }
    const { chart, valuesFile, additionalArgs } = req.body;
    const result = await k8sService.helmUpgrade(releaseName, namespace, { chart, valuesFile, additionalArgs });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/helm/:name/rollback', authorize(['admin', 'editor']), noCache, async (req, res, next) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || req.body.namespace || 'default';
    const { revision } = req.body;
    const result = await k8sService.helmRollback(releaseName, namespace, { revision });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/helm/:name', authorize(['admin']), noCache, async (req, res, next) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || 'default';
    const result = await k8sService.helmDelete(releaseName, namespace);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Analyzer Health Summary Route
// --------------------------------------------
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
