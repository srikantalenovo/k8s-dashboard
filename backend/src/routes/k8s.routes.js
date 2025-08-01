import express from 'express';
import { validateToken } from '../middleware/validate.js';
import { checkPermission } from '../middleware/rbac.js';
import {
  getNodes,
  getNamespaces,
  getPods,
  getDeployments,
  getPodMetrics
} from '../controllers/k8s.controller.js';

const router = express.Router();

// Apply auth middleware to all k8s routes
router.use(validateToken);

// Kubernetes API endpoints with RBAC checks
router.get('/nodes', checkPermission('nodes', 'read'), getNodes);
router.get('/namespaces', checkPermission('namespaces', 'read'), getNamespaces);
router.get('/pods', checkPermission('pods', 'read'), getPods);
router.get('/pods/:namespace', checkPermission('pods', 'read'), getPods);
router.get('/deployments', checkPermission('deployments', 'read'), getDeployments);
router.get('/deployments/:namespace', checkPermission('deployments', 'read'), getDeployments);
router.get('/pods/:namespace/:name/metrics', checkPermission('pods', 'read'), getPodMetrics);

export default router;
