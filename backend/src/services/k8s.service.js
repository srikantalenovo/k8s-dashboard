import k8s from '@kubernetes/client-node';

class K8sService {
  constructor() {
    try {
      this.kc = new k8s.KubeConfig();
      this.kc.loadFromDefault(); // Loads from /root/.kube/config inside container
      this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
      this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    } catch (err) {
      console.error('❌ Failed to initialize Kubernetes client:', err);
    }
  }

  async getClusterInfo() {
    try {
      const nodes = await this.coreV1Api.listNode();
      return {
        clusterName: this.kc.getCurrentCluster()?.name || 'Unknown Cluster',
        nodes: nodes.body.items.length,
        status: 'Healthy',
        timestamp: new Date()
      };
    } catch (err) {
      console.error('❌ Error fetching cluster info:', err);
      throw err;
    }
  }

  async getNamespaces() {
    try {
      const res = await this.coreV1Api.listNamespace();
      return res.body.items.map(ns => ns.metadata.name);
    } catch (err) {
      console.error('❌ Error fetching namespaces:', err);
      throw err;
    }
  }

  async getNodes() {
    try {
      const res = await this.coreV1Api.listNode();
      return res.body.items.map(node => ({
        name: node.metadata.name,
        status: node.status.conditions.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
        cpu: node.status.capacity.cpu,
        memory: node.status.capacity.memory
      }));
    } catch (err) {
      console.error('❌ Error fetching nodes:', err);
      throw err;
    }
  }

  async getPods(namespace = 'default') {
    try {
      const res = await this.coreV1Api.listNamespacedPod(namespace);
      return res.body.items.map(pod => ({
        name: pod.metadata.name,
        status: pod.status.phase,
        namespace: pod.metadata.namespace,
        node: pod.spec.nodeName
      }));
    } catch (err) {
      console.error(`❌ Error fetching pods from namespace ${namespace}:`, err);
      throw err;
    }
  }

  async getDeployments(namespace = 'default') {
    try {
      const res = await this.appsV1Api.listNamespacedDeployment(namespace);
      return res.body.items.map(dep => ({
        name: dep.metadata.name,
        replicas: dep.status.replicas || 0,
        available: dep.status.availableReplicas || 0,
        namespace: dep.metadata.namespace
      }));
    } catch (err) {
      console.error(`❌ Error fetching deployments from namespace ${namespace}:`, err);
      throw err;
    }
  }

  async deletePod(name, namespace = 'default') {
    try {
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      return true;
    } catch (err) {
      console.error(`❌ Error deleting pod ${name} in namespace ${namespace}:`, err);
      return false;
    }
  }

  async restartPod(name, namespace = 'default') {
    try {
      await this.coreV1Api.deleteNamespacedPod(name, namespace);
      return true;
    } catch (err) {
      console.error(`❌ Error restarting pod ${name} in namespace ${namespace}:`, err);
      return false;
    }
  }
}

export default new K8sService();
