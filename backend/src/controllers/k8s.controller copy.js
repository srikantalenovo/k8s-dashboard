import k8sService from '../services/k8s.service.js';

export const getClusterInfo = async (req, res) => {
  try {
    const data = await k8sService.getClusterInfo();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cluster info' });
  }
};

export const getNamespaces = async (req, res) => {
  try {
    const data = await k8sService.getNamespaces();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch namespaces' });
  }
};

export const getNodes = async (req, res) => {
  try {
    const data = await k8sService.getNodes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

export const getPods = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const data = await k8sService.getPods(namespace);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pods' });
  }
};

export const getDeployments = async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    const data = await k8sService.getDeployments(namespace);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
};

export const deletePod = async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.deletePod(name, namespace);
    success ? res.json({ message: 'Pod deleted' }) : res.status(404).json({ error: 'Pod not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete pod' });
  }
};

export const restartPod = async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    const success = await k8sService.restartPod(name, namespace);
    success ? res.json({ message: 'Pod restarted' }) : res.status(404).json({ error: 'Pod not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart pod' });
  }
};
