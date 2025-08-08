// controllers/podActions.controller.js
import k8s from '@kubernetes/client-node';
import util from 'util';
import { exec as execCb } from 'child_process';

const exec = util.promisify(execCb);

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

// List Pods
export const listPods = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const response = await k8sApi.listNamespacedPod(namespace);
    res.json(response.body.items);
  } catch (err) {
    console.error('Error listing pods:', err);
    res.status(500).json({ error: err.message });
  }
};

// List Deployments
export const listDeployments = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const response = await appsApi.listNamespacedDeployment(namespace);
    res.json(response.body.items);
  } catch (err) {
    console.error('Error listing deployments:', err);
    res.status(500).json({ error: err.message });
  }
};

// List Helm Releases
export const listHelmReleases = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const { stdout } = await exec(`helm list -n ${namespace} -o json`);
    res.json(JSON.parse(stdout));
  } catch (err) {
    console.error('Error listing helm releases:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Pod
export const deletePod = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const name = req.params.name;
    await k8sApi.deleteNamespacedPod(name, namespace);
    res.json({ message: `Pod ${name} deleted successfully` });
  } catch (err) {
    console.error('Error deleting pod:', err);
    res.status(500).json({ error: err.message });
  }
};

// Restart Pod
export const restartPod = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const name = req.params.name;
    await k8sApi.deleteNamespacedPod(name, namespace);
    res.json({ message: `Pod ${name} restarted successfully` });
  } catch (err) {
    console.error('Error restarting pod:', err);
    res.status(500).json({ error: err.message });
  }
};

// Restart Deployment
export const restartDeployment = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const name = req.params.name;
    const deployment = await appsApi.readNamespacedDeployment(name, namespace);
    deployment.body.spec.template.metadata.annotations = {
      ...deployment.body.spec.template.metadata.annotations,
      'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
    };
    await appsApi.replaceNamespacedDeployment(name, namespace, deployment.body);
    res.json({ message: `Deployment ${name} restarted successfully` });
  } catch (err) {
    console.error('Error restarting deployment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Scale Deployment
export const scaleDeployment = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const name = req.params.name;
    const { replicas } = req.body;
    const scale = await appsApi.readNamespacedDeploymentScale(name, namespace);
    scale.body.spec.replicas = replicas;
    await appsApi.replaceNamespacedDeploymentScale(name, namespace, scale.body);
    res.json({ message: `Deployment ${name} scaled to ${replicas} replicas` });
  } catch (err) {
    console.error('Error scaling deployment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Uninstall Helm Release
export const uninstallHelmRelease = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const name = req.params.name;
    await exec(`helm uninstall ${name} -n ${namespace}`);
    res.json({ message: `Helm release ${name} uninstalled successfully` });
  } catch (err) {
    console.error('Error uninstalling helm release:', err);
    res.status(500).json({ error: err.message });
  }
};
