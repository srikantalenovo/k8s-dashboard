// routes/podActions.routes.js
import express from 'express';
import {
  deletePod,
  restartPod,
  getPodLogs,
  deleteDeployment,
  restartDeployment,
  scaleDeployment,
  listHelmReleases,
  uninstallHelmRelease
} from '../controllers/podActions.controller.js';

const router = express.Router();

router.post('/pod/delete', deletePod);
router.post('/pod/restart', restartPod);
router.get('/pod/logs', getPodLogs);

router.post('/deployment/delete', deleteDeployment);
router.post('/deployment/restart', restartDeployment);
router.post('/deployment/scale', scaleDeployment);

router.get('/helm/list', listHelmReleases);
router.post('/helm/uninstall', uninstallHelmRelease);

export default router;
