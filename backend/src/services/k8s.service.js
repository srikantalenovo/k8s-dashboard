import { KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api, BatchV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';
import fs from 'fs/promises';

class K8sService {
  constructor() {
    this.kc = new KubeConfig();
    this.coreV1Api = null;
    this.appsV1Api = null;
    this.networkingV1Api = null;
    this.batchV1Api = null;
    this.mode = 'unknown';
    this.initialized = false;
  }

  async init() {
    try {
      this.kc.loadFromCluster();
      this.mode = 'in-cluster';
      logger.info('📦 Using in-cluster Kubernetes config');
      if (this.mode === 'in-cluster') {
        try {
          const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
          await fs.access(tokenPath);
          logger.info('🔑 Verified ServiceAccount token is mounted');
        } catch (tokenErr) {
          logger.error('❌ ServiceAccount token verification failed', {
            error: tokenErr.message,
            hint: 'Ensure your pod has serviceAccountName set and the token is mounted'
          });
          throw tokenErr;
        }
      }
    } catch (err) {
      try {
        this.kc.loadFromDefault();
        this.mode = 'external';
        logger.info('💻 Using external kubeconfig');
      } catch (fallbackErr) {
        logger.error('❌ Failed to load any Kubernetes configuration', {
          error: fallbackErr.message,
          stack: fallbackErr.stack,
          hint: 'Check if running inside cluster or provide valid kubeconfig'
        });
        throw new Error('Could not initialize Kubernetes client');
      }
    }

    this.coreV1Api = this.kc.makeApiClient(CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(AppsV1Api);
    this.networkingV1Api = this.kc.makeApiClient(NetworkingV1Api);
    this.batchV1Api = this.kc.makeApiClient(BatchV1Api);

    if (this.coreV1Api && this.coreV1Api.defaults) {
      this.coreV1Api.defaults.timeout = 10000;
    }
    this.initialized = true;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.coreV1Api) {
      throw new Error('Kubernetes API client not initialized');
    }
  }

  // ========================
  // NEW RESOURCE FUNCTIONS
  // ========================

  async getServices(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedService(namespace);
    return res.body.items.map(svc => ({
      name: svc.metadata.name,
      namespace: svc.metadata.namespace,
      type: svc.spec.type,
      clusterIP: svc.spec.clusterIP,
      ports: svc.spec.ports,
      creationTimestamp: svc.metadata.creationTimestamp
    }));
  }

  async getConfigMaps(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedConfigMap(namespace);
    return res.body.items.map(cm => ({
      name: cm.metadata.name,
      namespace: cm.metadata.namespace,
      dataKeys: Object.keys(cm.data || {}),
      creationTimestamp: cm.metadata.creationTimestamp
    }));
  }

  async getSecrets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedSecret(namespace);
    return res.body.items.map(secret => ({
      name: secret.metadata.name,
      namespace: secret.metadata.namespace,
      type: secret.type,
      dataKeys: Object.keys(secret.data || {}),
      creationTimestamp: secret.metadata.creationTimestamp
    }));
  }

  async getPersistentVolumes() {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listPersistentVolume();
    return res.body.items.map(pv => ({
      name: pv.metadata.name,
      capacity: pv.spec.capacity,
      accessModes: pv.spec.accessModes,
      reclaimPolicy: pv.spec.persistentVolumeReclaimPolicy,
      status: pv.status.phase,
      storageClass: pv.spec.storageClassName,
      creationTimestamp: pv.metadata.creationTimestamp
    }));
  }

  async getPersistentVolumeClaims(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedPersistentVolumeClaim(namespace);
    return res.body.items.map(pvc => ({
      name: pvc.metadata.name,
      namespace: pvc.metadata.namespace,
      capacity: pvc.status.capacity,
      accessModes: pvc.status.accessModes,
      status: pvc.status.phase,
      storageClass: pvc.spec.storageClassName,
      creationTimestamp: pvc.metadata.creationTimestamp
    }));
  }

  async getDeployments(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedDeployment(namespace);
    return res.body.items.map(dep => ({
      name: dep.metadata.name,
      namespace: dep.metadata.namespace,
      replicas: dep.spec.replicas,
      availableReplicas: dep.status.availableReplicas,
      creationTimestamp: dep.metadata.creationTimestamp
    }));
  }

  async getStatefulSets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedStatefulSet(namespace);
    return res.body.items.map(sts => ({
      name: sts.metadata.name,
      namespace: sts.metadata.namespace,
      replicas: sts.spec.replicas,
      readyReplicas: sts.status.readyReplicas,
      creationTimestamp: sts.metadata.creationTimestamp
    }));
  }

  async getDaemonSets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedDaemonSet(namespace);
    return res.body.items.map(ds => ({
      name: ds.metadata.name,
      namespace: ds.metadata.namespace,
      desiredNumberScheduled: ds.status.desiredNumberScheduled,
      numberReady: ds.status.numberReady,
      creationTimestamp: ds.metadata.creationTimestamp
    }));
  }

  async getReplicaSets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedReplicaSet(namespace);
    return res.body.items.map(rs => ({
      name: rs.metadata.name,
      namespace: rs.metadata.namespace,
      replicas: rs.spec.replicas,
      readyReplicas: rs.status.readyReplicas,
      creationTimestamp: rs.metadata.creationTimestamp
    }));
  }

  async getIngresses(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.networkingV1Api.listNamespacedIngress(namespace);
    return res.body.items.map(ing => ({
      name: ing.metadata.name,
      namespace: ing.metadata.namespace,
      rules: ing.spec.rules,
      creationTimestamp: ing.metadata.creationTimestamp
    }));
  }

  async getNetworkPolicies(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.networkingV1Api.listNamespacedNetworkPolicy(namespace);
    return res.body.items.map(np => ({
      name: np.metadata.name,
      namespace: np.metadata.namespace,
      podSelector: np.spec.podSelector,
      policyTypes: np.spec.policyTypes,
      creationTimestamp: np.metadata.creationTimestamp
    }));
  }

  async getJobs(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.batchV1Api.listNamespacedJob(namespace);
    return res.body.items.map(job => ({
      name: job.metadata.name,
      namespace: job.metadata.namespace,
      completions: job.spec.completions,
      succeeded: job.status.succeeded,
      creationTimestamp: job.metadata.creationTimestamp
    }));
  }

  async getCronJobs(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.batchV1Api.listNamespacedCronJob(namespace);
    return res.body.items.map(cj => ({
      name: cj.metadata.name,
      namespace: cj.metadata.namespace,
      schedule: cj.spec.schedule,
      suspend: cj.spec.suspend,
      creationTimestamp: cj.metadata.creationTimestamp
    }));
  }
}

// Keep your existing singleton export
const k8sService = new K8sService();
await k8sService.init().catch(err => {
  logger.error('❌ Failed to initialize Kubernetes service', { error: err.message });
  process.exit(1);
});

export default k8sService;
