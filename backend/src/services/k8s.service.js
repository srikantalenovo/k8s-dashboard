// src/services/k8s.service.js
import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node';

class K8sService {
  constructor() {
    try {
      this.kc = new KubeConfig();
      // Load kubeconfig from default location (/root/.kube/config in container)
      this.kc.loadFromDefault();

      this.coreV1Api = this.kc.makeApiClient(CoreV1Api);
      this.appsV1Api = this.kc.makeApiClient(AppsV1Api);

      console.log('✅ Kubernetes client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Kubernetes client:', error);
      throw error;
    }
  }

  /**
   * Fetch all namespaces
   */
  async getNamespaces() {
    try {
      const res = await this.coreV1Api.listNamespace();
      return res.body.items.map(ns => ns.metadata.name);
    } catch (error) {
      console.error('❌ Error fetching namespaces:', error.body || error);
      throw new Error('Failed to fetch namespaces');
    }
  }

  /**
   * Fetch pods in a namespace (default = "default")
   */
  async getPods(namespace = 'default') {
    try {
      const res = await this.coreV1Api.listNamespacedPod(namespace);
      return res.body.items.map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status.phase,
        nodeName: pod.spec.nodeName,
        startTime: pod.status.startTime,
      }));
    } catch (error) {
      console.error(`❌ Error fetching pods in namespace ${namespace}:`, error.body || error);
      throw new Error(`Failed to fetch pods for namespace ${namespace}`);
    }
  }

  /**
   * Fetch deployments in a namespace (default = "default")
   */
  async getDeployments(namespace = 'default') {
    try {
      const res = await this.appsV1Api.listNamespacedDeployment(namespace);
      return res.body.items.map(dep => ({
        name: dep.metadata.name,
        namespace: dep.metadata.namespace,
        replicas: dep.status.replicas || 0,
        availableReplicas: dep.status.availableReplicas || 0,
        updatedReplicas: dep.status.updatedReplicas || 0
      }));
    } catch (error) {
      console.error(`❌ Error fetching deployments in namespace ${namespace}:`, error.body || error);
      throw new Error(`Failed to fetch deployments for namespace ${namespace}`);
    }
  }

  /**
   * Fetch all cluster nodes
   */
  async getNodes() {
    try {
      const res = await this.coreV1Api.listNode();
      return res.body.items.map(node => ({
        name: node.metadata.name,
        status: node.status.conditions.find(c => c.type === 'Ready')?.status || 'Unknown',
        roles: node.metadata.labels['kubernetes.io/role'] || 'worker',
        version: node.status.nodeInfo.kubeletVersion,
        osImage: node.status.nodeInfo.osImage
      }));
    } catch (error) {
      console.error('❌ Error fetching nodes:', error.body || error);
      throw new Error('Failed to fetch nodes');
    }
  }

  /**
   * Delete a pod
   */
  async deletePod(namespace, name) {
    try {
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting pod ${name} in namespace ${namespace}:`, error.body || error);
      return false;
    }
  }

  /**
   * Restart a pod (delete and let deployment recreate)
   */
  async restartPod(namespace, name) {
    try {
      await this.deletePod(namespace, name);
      return true;
    } catch (error) {
      console.error(`❌ Error restarting pod ${name} in namespace ${namespace}:`, error.body || error);
      return false;
    }
  }
}

export default new K8sService();
