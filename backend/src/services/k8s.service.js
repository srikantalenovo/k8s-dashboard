import * as k8s from '@kubernetes/client-node';

class K8sService {
  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
  }

  // Get cluster info
  async getClusterInfo() {
    try {
      const nodes = await this.getNodes();
      return {
        clusterName: process.env.CLUSTER_NAME || 'K8s-Cluster',
        nodes: nodes.length,
        status: nodes.every(n => n.status === 'Ready') ? 'Healthy' : 'Degraded',
        timestamp: new Date()
      };
    } catch (err) {
      console.error('❌ Error fetching cluster info:', err);
      throw err;
    }
  }

  // Get all namespaces
  async getNamespaces() {
    try {
      const res = await this.coreV1Api.listNamespace();
      return res.body.items?.map(ns => ns.metadata?.name) || [];
    } catch (err) {
      console.error('❌ Error fetching namespaces:', err);
      throw err;
    }
  }

  // Get pods in a namespace
  async getPods(namespace = 'default') {
    try {
      if (!namespace) namespace = 'default';
      const res = await this.coreV1Api.listNamespacedPod(namespace);
      return res.body.items?.map(pod => ({
        name: pod.metadata?.name,
        namespace: pod.metadata?.namespace,
        status: pod.status?.phase,
        node: pod.spec?.nodeName,
        restarts: pod.status?.containerStatuses?.reduce((acc, cs) => acc + (cs.restartCount || 0), 0) || 0,
        age: pod.metadata?.creationTimestamp
      })) || [];
    } catch (err) {
      console.error(`❌ Error fetching pods in namespace ${namespace}:`, err);
      throw err;
    }
  }

  // Get nodes
  async getNodes() {
    try {
      const res = await this.coreV1Api.listNode();
      if (!res.body.items) return [];
      return res.body.items.map(node => ({
        name: node.metadata?.name,
        status: node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
        roles: node.metadata?.labels?.['kubernetes.io/role'] || Object.keys(node.metadata?.labels || {}).find(k => k.includes('role')) || 'N/A',
        age: node.metadata?.creationTimestamp,
        version: node.status?.nodeInfo?.kubeletVersion
      }));
    } catch (err) {
      console.error('❌ Error fetching nodes:', err);
      throw err;
    }
  }

  // Delete pod
  async deletePod(name, namespace = 'default') {
    try {
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      return true;
    } catch (err) {
      console.error(`❌ Error deleting pod ${name}:`, err);
      return false;
    }
  }

  // Restart pod
  async restartPod(name, namespace = 'default') {
    try {
      const pod = await this.coreV1Api.readNamespacedPod(name, namespace);
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      console.log(`✅ Restarted pod ${name} in namespace ${namespace}`);
      return pod.body;
    } catch (err) {
      console.error(`❌ Error restarting pod ${name}:`, err);
      return false;
    }
  }
}

export default new K8sService();
