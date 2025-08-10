// controllers/k8s.controllers.js
import k8sService from '../services/k8s.service.js';

// Existing/basic controllers (kept)
export const getClusterInfo = async (req, res) => {
  try {
    const data = await k8sService.getClusterInfo?.() ?? { message: 'getClusterInfo not implemented' };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cluster info' });
  }
};

export const getNamespaces = async (req, res) => {
  try {
    const data = await k8sService.getNamespaces();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch namespaces' });
  }
};

export const getNodes = async (req, res) => {
  try {
    const data = await k8sService.getNodes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

export const getPods = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const data = await k8sService.getPods(namespace);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pods' });
  }
};

export const getDeployments = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const data = await k8sService.getDeployments(namespace);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
};

export const deletePod = async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.deletePod(name, namespace);
    success ? res.json({ message: 'Pod deleted' }) : res.status(404).json({ error: 'Pod not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete pod' });
  }
};

export const restartPod = async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.restartPod(name, namespace);
    success ? res.json({ message: 'Pod restarted' }) : res.status(404).json({ error: 'Pod not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart pod' });
  }
};

// ======================
// New controllers returning formatted responses
// ======================

export const getPodsSummary = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const status = req.query.status || null;
    const errorPodsOnly = req.query.errorPodsOnly === 'true';
    const sortBy = req.query.sortBy || null;
    const sortOrder = req.query.sortOrder || 'asc';
    const result = await k8sService.getPodsFormatted(namespace, { status, errorPodsOnly }, sortBy, sortOrder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

export const getDeploymentsSummary = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const sortBy = req.query.sortBy || null;
    const sortOrder = req.query.sortOrder || 'asc';
    const result = await k8sService.getDeploymentsFormatted(namespace, sortBy, sortOrder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

export const getServicesSummary = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const sortBy = req.query.sortBy || null;
    const sortOrder = req.query.sortOrder || 'asc';
    const result = await k8sService.getServicesFormatted(namespace, sortBy, sortOrder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

export const getHelmSummary = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const sortBy = req.query.sortBy || null;
    const sortOrder = req.query.sortOrder || 'asc';
    const result = await k8sService.getHelmReleasesFormatted(namespace, sortBy, sortOrder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

// Helm action controllers
export const helmUpgrade = async (req, res) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || req.body.namespace || 'default';
    const { chart, valuesFile, additionalArgs } = req.body;
    const result = await k8sService.helmUpgrade(releaseName, namespace, { chart, valuesFile, additionalArgs });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

export const helmRollback = async (req, res) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || req.body.namespace || 'default';
    const { revision } = req.body;
    const result = await k8sService.helmRollback(releaseName, namespace, { revision });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};

export const helmDelete = async (req, res) => {
  try {
    const releaseName = req.params.name;
    const namespace = req.query.namespace || 'default';
    const result = await k8sService.helmDelete(releaseName, namespace);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', errors: [err.message] });
  }
};
