import * as k8s from '@kubernetes/client-node';
import fs from 'fs';
import logger from '../utils/logger.js';

class K8sService {
  constructor() {
    this.kc = new k8s.KubeConfig();

    const kubeConfigPath = process.env.KUBECONFIG || '/root/.kube/config';

    if (!fs.existsSync(kubeConfigPath)) {
      logger.error(`❌ Kubeconfig file not found at: ${kubeConfigPath}`);
      throw new Error('Kubeconfig missing — cannot connect to cluster');
    }

    this.kc.loadFromFile(kubeConfigPath);
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
  }

  async verifyClusterConnection() {
    try {
      const context = this.kc.getCurrentContext();
      const cluster = this.kc.getCluster(context);

      logger.info(`🌐 Using kube context: ${context}`);
      logger.info(`📡 API server: ${cluster?.server || 'Unknown'}`);

      const res = await this.coreV1Api.listNamespace();

      logger.debug('📦 Raw namespace API response:', JSON.stringify(res.body || res, null, 2));

      if (!res?.body?.items) {
        throw new Error('Namespace list is empty or invalid');
      }

      logger.info(`✅ Kubernetes cluster connected — found ${res.body.items.length} namespaces`);
      res.body.items.forEach(ns => {
        logger.info(`📂 Namespace: ${ns.metadata?.name}`);
      });

    } catch (err) {
      logger.error(`❌ Unable to connect to Kubernetes cluster: ${err.message}`, { stack: err.stack });
      throw err;
    }
  }
}

export default new K8sService();
