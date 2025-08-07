// controllers/podActions.controller.js
import k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

// --- POD ACTIONS ---
export const deletePod = async (req, res) => {
  const { namespace, podName } = req.body;
  try {
    await k8sApi.deleteNamespacedPod(podName, namespace);
    res.json({ message: `Pod ${podName} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restartPod = async (req, res) => {
  const { namespace, podName } = req.body;
  try {
    await k8sApi.deleteNamespacedPod(podName, namespace);
    res.json({ message: `Pod ${podName} restarted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPodLogs = async (req, res) => {
  const { namespace, podName, containerName } = req.query;
  const logApi = kc.makeApiClient(k8s.Log);

  try {
    const logs = await logApi.log(namespace, podName, containerName, {});
    res.send(logs.body || '');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DEPLOYMENT ACTIONS ---
export const deleteDeployment = async (req, res) => {
  const { namespace, deploymentName } = req.body;
  try {
    await appsApi.deleteNamespacedDeployment(deploymentName, namespace);
    res.json({ message: `Deployment ${deploymentName} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const restartDeployment = async (req, res) => {
  const { namespace, deploymentName } = req.body;
  try {
    const patch = [
      {
        op: 'add',
        path: '/spec/template/metadata/annotations/restartedAt',
        value: new Date().toISOString(),
      },
    ];

    await appsApi.patchNamespacedDeployment(
      deploymentName,
      namespace,
      patch,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: { 'Content-Type': 'application/json-patch+json' },
      }
    );

    res.json({ message: `Deployment ${deploymentName} restarted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scaleDeployment = async (req, res) => {
  const { namespace, deploymentName, replicas } = req.body;
  try {
    const scale = {
      spec: { replicas },
    };

    await appsApi.patchNamespacedDeploymentScale(
      deploymentName,
      namespace,
      scale,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }
    );

    res.json({ message: `Deployment ${deploymentName} scaled to ${replicas}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- HELM ACTIONS ---
export const getHelmReleases = async (req, res) => {
  const { namespace } = req.query;

  try {
    const command = namespace
      ? `helm list -n ${namespace} --output json`
      : `helm list --all-namespaces --output json`;

    const { stdout } = await execAsync(command);
    const releases = JSON.parse(stdout);

    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uninstallHelmRelease = async (req, res) => {
  const { release, namespace } = req.params;

  try {
    await execAsync(`helm uninstall ${release} -n ${namespace}`);
    res.json({ message: `Helm release ${release} uninstalled.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
