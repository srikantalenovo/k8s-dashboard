import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';

class K8sService {
  constructor() {
    this.kc = new KubeConfig();

    try {
      // Try in-cluster config first
      this.kc.loadFromCluster();
      this.mode = 'in-cluster';
      logger.info('📦 Using in-cluster Kubernetes config');
    } catch (err) {
      // If that fails, fall back to local kubeconfig
      this.kc.loadFromDefault();
      this.mode = 'external';
      logger.info('💻 Using external kubeconfig');
    }

    this.coreV1Api = this.kc.makeApiClient(CoreV1Api);
  }

  async verifyClusterConnection() {
    try {
      logger.info('🔍 Verifying Kubernetes cluster connection...');
      const nsRes = await this.coreV1Api.listNamespace();

      // Log raw API response
      logger.debug('📥 Raw namespace API response:', JSON.stringify(nsRes.body, null, 2));

      if (!nsRes.body.items || nsRes.body.items.length === 0) {
        throw new Error('Namespace list is empty or invalid');
      }

      logger.info(`🌐 Kubernetes mode: ${this.mode}`);
      logger.info(`📡 API server: ${this.kc.getCurrentCluster()?.server || 'Unknown'}`);
      logger.info(`✅ Found ${nsRes.body.items.length} namespaces`);
      return true;
    } catch (error) {
      logger.error(`❌ Unable to connect to Kubernetes cluster: ${error.message}`, { stack: error.stack });
      return false;
    }
  }

  async getNamespaces() {
    const res = await this.coreV1Api.listNamespace();
    return res.body.items.map(ns => ns.metadata.name);
  }

  async getNodes() {
    const res = await this.coreV1Api.listNode();
    return res.body.items.map(node => ({
      name: node.metadata.name,
      status: node.status.conditions?.find(c => c.type === 'Ready')?.status || 'Unknown',
      roles: node.metadata.labels?.['kubernetes.io/role'] || 'worker',
      version: node.status.nodeInfo?.kubeletVersion
    }));
  }

  async getPods(namespace = 'default') {
    if (!namespace) throw new Error('Namespace is required');
    const res = await this.coreV1Api.listNamespacedPod(namespace);
    return res.body.items.map(pod => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      namespace: pod.metadata.namespace,
      nodeName: pod.spec.nodeName,
      startTime: pod.status.startTime
    }));
  }

  async deletePod(name, namespace = 'default') {
    await this.coreV1Api.deleteNamespacedPod(name, namespace);
    logger.info(`🗑️ Pod deleted: ${name} in namespace ${namespace}`);
    return true;
  }

  async restartPod(name, namespace = 'default') {
    const pod = await this.coreV1Api.readNamespacedPod(name, namespace);
    await this.coreV1Api.deleteNamespacedPod(name, namespace);
    logger.info(`🔄 Restarted pod: ${name} in namespace ${namespace}`);
    return pod.body;
  }
}

export default new K8sService();
