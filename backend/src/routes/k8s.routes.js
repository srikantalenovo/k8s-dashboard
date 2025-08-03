import express from 'express';
import { authorize } from '../middleware/rbac.js';
import {
  getClusterInfo,
  getNamespaces,
  getNodes,
  getPods,
  getDeployments,
  deletePod,
  restartPod
} from '../controllers/k8s.controller.js';

const router = express.Router();

router.get('/cluster-info', authorize(['admin', 'editor', 'viewer']), getClusterInfo);
router.get('/namespaces', authorize(['admin', 'editor', 'viewer']), getNamespaces);
router.get('/nodes', authorize(['admin', 'editor', 'viewer']), getNodes);
router.get('/pods', authorize(['admin', 'editor', 'viewer']), getPods);
router.get('/deployments', authorize(['admin', 'editor', 'viewer']), getDeployments);
router.delete('/pods/:name', authorize(['admin', 'editor']), deletePod);
router.post('/pods/:name/restart', authorize(['admin', 'editor']), restartPod);

export default router;
