// routes/podActions.routes.js
import express from 'express';
import {
  deletePod,
  restartPod,
  getPodLogs,
  deleteDeployment,
  restartDeployment,
  scaleDeployment,
  getHelmReleases,
  uninstallHelmRelease,
} from '../controllers/podActions.controller.js';

const router = express.Router();

router.post('/pod/delete', deletePod);
router.post('/pod/restart', restartPod);
router.get('/pod/logs', getPodLogs);

router.post('/deployment/delete', deleteDeployment);
router.post('/deployment/restart', restartDeployment);
router.post('/deployment/scale', scaleDeployment);

router.get('/helm/releases', getHelmReleases);
router.delete('/helm/uninstall/:namespace/:release', uninstallHelmRelease);

export default router;
