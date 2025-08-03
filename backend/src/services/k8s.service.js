import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import fs from 'fs';
import logger from '../utils/logger.js';

class K8sService {
  constructor() {
    this.kc = new KubeConfig();

    // Detect mode: In-cluster or external
    if (fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token')) {
      logger.info('📦 Running inside Kubernetes cluster - using in-cluster config');
      this.kc.loadFromCluster();
      this.mode = 'in-cluster';
    } else {
      logger.info('💻 Running outside cluster - using default kubeconfig');
      this.kc.loadFromDefault();
      this.mode = 'external';
    }

    this.coreV1Api = this.kc.makeApiClient(CoreV1Api);
  }

  async verifyClusterConnection() {
    try {
      logger.info('🔍 Verifying Kubernetes cluster connection...');
      const nsRes = await this.coreV1Api.listNamespace();

      logger.debug(`📡 Raw namespace API response: ${JSON.stringify(nsRes.body, null, 2)}`);

      if (!nsRes?.body?.items || nsRes.body.items.length === 0) {
        throw new Error('Namespace list is empty or invalid');
      }

      logger.info(`🌐 Kubernetes mode: ${this.mode}`);
      logger.info(`📡 API server: ${this.kc.getCurrentCluster()?.server || 'Unknown'}`);
      logger.info(`✅ Found ${nsRes.body.items.length} namespaces`);
      return true;
    } catch (error) {
      logger.error(`❌ Unable to connect to Kubernetes cluster: ${error.message}`);
      logger.debug(error.stack);
      return false; // Fail gracefully instead of throwing
    }
  }

  async getClusterInfo() {
    try {
      const nodes = await this.coreV1Api.listNode();
      return {
        clusterName: this.kc.getCurrentCluster()?.name || 'Unknown',
        nodes: nodes.body.items.length,
        status: 'Healthy',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('❌ Error fetching cluster info:', error);
      throw error;
    }
  }

  async getNamespaces() {
    try {
      const res = await this.coreV1Api.listNamespace();
      return res.body.items.map(ns => ns.metadata.name);
    } catch (error) {
      logger.error('❌ Error fetching namespaces:', error);
      throw error;
    }
  }

  async getNodes() {
    try {
      const res = await this.coreV1Api.listNode();
      return res.body.items.map(node => ({
        name: node.metadata.name,
        status: node.status.conditions?.find(c => c.type === 'Ready')?.status || 'Unknown',
        roles: node.metadata.labels?.['kubernetes.io/role'] || 'worker',
        version: node.status.nodeInfo?.kubeletVersion
      }));
    } catch (error) {
      logger.error('❌ Error fetching nodes:', error);
      throw error;
    }
  }

  async getPods(namespace = 'default') {
    try {
      if (!namespace) throw new Error('Namespace is required');
      const res = await this.coreV1Api.listNamespacedPod(namespace);
      return res.body.items.map(pod => ({
        name: pod.metadata.name,
        status: pod.status.phase,
        namespace: pod.metadata.namespace,
        nodeName: pod.spec.nodeName,
        startTime: pod.status.startTime
      }));
    } catch (error) {
      logger.error(`❌ Error fetching pods in namespace ${namespace}:`, error);
      throw error;
    }
  }

  async deletePod(name, namespace = 'default') {
    try {
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      logger.info(`🗑️ Pod deleted: ${name} in namespace ${namespace}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error deleting pod ${name} in namespace ${namespace}:`, error);
      return false;
    }
  }

  async restartPod(name, namespace = 'default') {
    try {
      const pod = await this.coreV1Api.readNamespacedPod(name, namespace);
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      logger.info(`🔄 Restarted pod: ${name} in namespace ${namespace}`);
      return pod.body;
    } catch (error) {
      logger.error(`❌ Error restarting pod ${name} in namespace ${namespace}:`, error);
      return false;
    }
  }
}

export default new K8sService();
