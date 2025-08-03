import express from 'express';
import { authorize } from '../middleware/rbac.js';
import k8sService from '../services/k8s.service.js';

const router = express.Router();

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
