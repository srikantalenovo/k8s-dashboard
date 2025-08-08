// podActions.controller.js
import k8s from '@kubernetes/client-node';
import { exec } from 'child_process';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

// ---------- LIST ----------
export const listPods = async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const pods = await k8sApi.listNamespacedPod(namespace);
    res.json(pods.body.items);
  } catch (err) {
    next(err);
  }
};

export const listDeployments = async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    const deployments = await appsApi.listNamespacedDeployment(namespace);
    res.json(deployments.body.items);
  } catch (err) {
    next(err);
  }
};

export const listHelmReleases = async (req, res, next) => {
  try {
    const namespace = req.query.namespace || 'default';
    exec(`helm list -n ${namespace} -o json`, (error, stdout) => {
      if (error) return next(error);
      res.json(JSON.parse(stdout));
    });
  } catch (err) {
    next(err);
  }
};

// ---------- ACTIONS ----------
export const deletePod = async (req, res, next) => {
  try {
    const { namespace } = req.query;
    await k8sApi.deleteNamespacedPod(req.params.name, namespace);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const restartPod = async (req, res, next) => {
  try {
    const { namespace } = req.query;
    // restart = delete pod → K8s will recreate
    await k8sApi.deleteNamespacedPod(req.params.name, namespace);
    res.json({ success: true, message: 'Pod restarted' });
  } catch (err) {
    next(err);
  }
};

export const restartDeployment = async (req, res, next) => {
  try {
    const { namespace } = req.query;
    const deploymentName = req.params.name;
    await appsApi.patchNamespacedDeployment(
      deploymentName,
      namespace,
      { spec: { template: { metadata: { annotations: { 'kubectl.kubernetes.io/restartedAt': new Date().toISOString() } } } } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    res.json({ success: true, message: 'Deployment restarted' });
  } catch (err) {
    next(err);
  }
};

export const scaleDeployment = async (req, res, next) => {
  try {
    const { namespace, replicas } = req.body;
    const deploymentName = req.params.name;
    await appsApi.patchNamespacedDeploymentScale(
      deploymentName,
      namespace,
      { spec: { replicas } },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    res.json({ success: true, message: `Scaled to ${replicas}` });
  } catch (err) {
    next(err);
  }
};

export const uninstallHelmRelease = async (req, res, next) => {
  try {
    const { namespace } = req.query;
    exec(`helm uninstall ${req.params.name} -n ${namespace}`, (error) => {
      if (error) return next(error);
      res.json({ success: true });
    });
  } catch (err) {
    next(err);
  }
};
