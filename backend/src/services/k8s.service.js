import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';

class K8sService {
  constructor() {
    try {
      this.kc = new KubeConfig();

      // Load kubeconfig
      if (process.env.KUBECONFIG) {
        this.kc.loadFromFile(process.env.KUBECONFIG);
        logger.info(`✅ Loaded kubeconfig from ${process.env.KUBECONFIG}`);
      } else {
        this.kc.loadFromDefault();
        logger.info('✅ Loaded kubeconfig from default location');
      }

      this.coreV1 = this.kc.makeApiClient(CoreV1Api);
      this.appsV1 = this.kc.makeApiClient(AppsV1Api);

      // 🔹 Verify cluster connection at startup
      this.verifyClusterConnection();

    } catch (err) {
      logger.error('❌ Failed to initialize Kubernetes client:', err);
    }
  }

  async verifyClusterConnection() {
    try {
      const res = await this.coreV1.listNamespace();
      logger.info(`🚀 Kubernetes cluster connected — found ${res.body.items.length} namespaces`);
    } catch (err) {
      logger.error('❌ Unable to connect to Kubernetes cluster:', err.body || err);
    }
  }

  async getNamespaces() {
    try {
      const res = await this.coreV1.listNamespace();
      return res.body.items.map(ns => ns.metadata.name);
    } catch (err) {
      logger.error('❌ Error fetching namespaces from cluster:', err.body || err);
      throw err;
    }
  }

  async getNodes() {
    try {
      const res = await this.coreV1.listNode();
      return res.body.items.map(node => ({
        name: node.metadata.name,
        status: node.status.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
        roles: node.metadata.labels['kubernetes.io/role'] || Object.keys(node.metadata.labels).filter(k => k.includes('node-role.kubernetes.io')).join(', ') || 'worker',
        age: node.metadata.creationTimestamp,
        version: node.status.nodeInfo.kubeletVersion
      }));
    } catch (err) {
      logger.error('❌ Error fetching nodes from cluster:', err.body || err);
      throw err;
    }
  }

  async getPods(namespace = 'default') {
    try {
      if (!namespace) throw new Error('Namespace parameter is required');
      const res = await this.coreV1.listNamespacedPod(namespace);
      return res.body.items.map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status.phase,
        nodeName: pod.spec.nodeName,
        startTime: pod.status.startTime
      }));
    } catch (err) {
      logger.error(`❌ Error fetching pods in namespace ${namespace}:`, err.body || err);
      throw err;
    }
  }

  async deletePod(name, namespace = 'default') {
    try {
      await this.coreV1.deleteNamespacedPod(name, namespace);
      return true;
    } catch (err) {
      logger.error(`❌ Error deleting pod ${name} in namespace ${namespace}:`, err.body || err);
      throw err;
    }
  }

  async restartPod(name, namespace = 'default') {
    try {
      await this.deletePod(name, namespace);
      return true;
    } catch (err) {
      logger.error(`❌ Error restarting pod ${name} in namespace ${namespace}:`, err.body || err);
      throw err;
    }
  }
}

export default new K8sService();
