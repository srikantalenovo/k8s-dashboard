// routes/podActions.routes.js
import express from 'express';
import {
  listPods,
  listDeployments,
  listHelmReleases,
  deletePod,
  restartPod,
  restartDeployment,
  scaleDeployment,
  uninstallHelmRelease
} from '../controllers/podActions.controller.js';
import { authorize } from '../middleware/rbac.js';
import noCache from '../middleware/noCache.js';

const router = express.Router();

// List
router.get('/pods', authorize(['admin', 'editor']), noCache, listPods);
router.get('/deployments', authorize(['admin', 'editor']), noCache, listDeployments);
router.get('/helm', authorize(['admin', 'editor']), noCache, listHelmReleases);

// Pod Actions
router.delete('/pods/:name', authorize(['admin', 'editor']), noCache, deletePod);
router.post('/pods/:name/restart', authorize(['admin', 'editor']), noCache, restartPod);

// Deployment Actions
router.post('/deployments/:name/restart', authorize(['admin', 'editor']), noCache, restartDeployment);
router.post('/deployments/:name/scale', authorize(['admin', 'editor']), noCache, scaleDeployment);

// Helm Actions
router.delete('/helm/:name', authorize(['admin', 'editor']), noCache, uninstallHelmRelease);

export default router;
