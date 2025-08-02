import express from 'express';
import { authorize } from '../middleware/rbac.js';
import {
  getClusterInfo,
  getPods,
  deletePod,
  restartPod
} from '../controllers/k8s.controller.js';

const router = express.Router();

// View cluster info — all roles
router.get('/cluster-info', authorize(['admin', 'editor', 'viewer']), getClusterInfo);

// View pods — all roles
router.get('/pods', authorize(['admin', 'editor', 'viewer']), getPods);

// Delete pod — Admin & Editor with delete permission
router.delete(
  '/pods/:name',
  authorize(['admin', 'editor'], { resource: 'k8s', action: 'delete' }),
  deletePod
);

// Restart pod — Admin & Editor with edit permission
router.post(
  '/pods/:name/restart',
  authorize(['admin', 'editor'], { resource: 'k8s', action: 'edit' }),
  restartPod
);

export default router;
