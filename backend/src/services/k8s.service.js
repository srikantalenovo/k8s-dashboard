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
    logger.info("🔍 Verifying Kubernetes cluster connection...");

    const nsRes = await this.coreV1Api.listNamespace();

    // Log the raw parsed response length
    const namespaces = nsRes?.body?.items || [];
    logger.info(`📦 Parsed Namespace API response count: ${namespaces.length}`, { timestamp: new Date().toISOString() });

    if (namespaces.length === 0) {
      logger.error("❌ Namespace list is empty — this usually means RBAC is misconfigured for the ServiceAccount.", {
        hint: "Check if the ServiceAccount has permission to list namespaces at cluster scope (ClusterRole + ClusterRoleBinding).",
        sa: process.env.K8S_SERVICE_ACCOUNT || "grepmind-sa",
      });
      throw new Error("Namespace list is empty or invalid (RBAC issue suspected)");
    }

    logger.info(`🌐 Kubernetes mode: ${this.mode}`);
    logger.info(`📡 API server: ${this.kc.getCurrentCluster()?.server || "Unknown"}`);
    logger.info(`✅ Found ${namespaces.length} namespaces`);
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
