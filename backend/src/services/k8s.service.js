// services/k8s.service.js
import { KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api, BatchV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';
import fs from 'fs/promises'; // Using fs promises API for async file operations
import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import { formatK8sResponse } from '../utils/responseFormatter.js';

const execAsync = promisify(execCb);

class K8sService {
  constructor() {
    this.kc = new KubeConfig();
    this.coreV1Api = null;
    this.appsV1Api = null;
    this.networkingV1Api = null;
    this.batchV1beta1Api = null;
    this.batchV1Api = null;
    this.mode = 'unknown';
    this.initialized = false;
  }

  async init() {
    try {
      // Try in-cluster config first
      this.kc.loadFromCluster();
      this.mode = 'in-cluster';
      logger.info('📦 Using in-cluster Kubernetes config');

      // Verify service account token is mounted (in-cluster only)
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
        // If that fails, fall back to local kubeconfig
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

    // Configure API client
    this.coreV1Api = this.kc.makeApiClient(CoreV1Api);
    this.appsV1Api = this.kc.makeApiClient(AppsV1Api);
    this.batchV1Api = this.kc.makeApiClient(BatchV1Api);
    this.networkingV1Api = this.kc.makeApiClient(NetworkingV1Api);

    // Add timeout configuration safely
    if (this.coreV1Api && this.coreV1Api.defaults) {
      const timeout = 10000; // 10 second timeout
      this.coreV1Api.defaults.timeout = timeout;
      this.appsV1Api.defaults.timeout = timeout;
      this.batchV1Api.defaults.timeout = timeout;
      if (this.batchV1beta1Api && this.batchV1beta1Api.defaults) {
        this.batchV1beta1Api.defaults.timeout = timeout;
      }
    } else {
      logger.warn('⚠️ Could not set timeout for Kubernetes API client');
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

  async verifyClusterConnection(retryCount = 3, retryDelay = 1000) {
    await this.ensureInitialized();
    logger.info("🔍 Verifying Kubernetes cluster connection...");

    let lastError = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const nsRes = await this.coreV1Api.listNamespace();
        const namespaces = nsRes?.body?.items || [];

        logger.info(`📦 Parsed Namespace API response count: ${namespaces.length}`, {
          timestamp: new Date().toISOString()
        });

        if (namespaces.length === 0) {
          logger.warn("⚠️ Namespace list is empty", {
            attempt,
            hint: 'This could indicate RBAC or API communication issues'
          });

          if (attempt === retryCount) {
            throw new Error("Namespace list is empty (RBAC or API issue suspected)");
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // Successful connection
        logger.info(`🌐 Kubernetes mode: ${this.mode}`);
        logger.info(`📡 API server: ${this.kc.getCurrentCluster()?.server || "Unknown"}`);
        logger.info(`✅ Found ${namespaces.length} namespaces`);
        return true;

      } catch (error) {
        lastError = error;
        logger.warn(`⚠️ Connection attempt ${attempt} failed: ${error.message}`);

        if (attempt === retryCount) {
          logger.error(`❌ Unable to connect to Kubernetes cluster after ${retryCount} attempts`, {
            error: error.message,
            stack: error.stack
          });
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError;
  }

  // -----------------------
  // EXISTING LIST / CRUD METHODS (kept as-is)
  // -----------------------

  async getNamespaces() {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespace();
    return res.body.items.map(ns => ({
      name: ns.metadata.name,
      status: ns.status.phase,
      creationTimestamp: ns.metadata.creationTimestamp,
      labels: ns.metadata.labels || {}
    }));
  }

  async getNodes() {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNode();
    return res.body.items.map(node => ({
      name: node.metadata.name,
      status: node.status.conditions?.find(c => c.type === 'Ready')?.status || 'Unknown',
      roles: Object.entries(node.metadata.labels || {})
        .filter(([key]) => key.includes('node-role.kubernetes.io'))
        .map(([, value]) => value || 'worker'),
      version: node.status.nodeInfo?.kubeletVersion,
      cpu: node.status.capacity?.cpu,
      memory: node.status.capacity?.memory,
      pods: node.status.capacity?.pods,
      osImage: node.status.nodeInfo?.osImage,
      architecture: node.status.nodeInfo?.architecture,
      creationTimestamp: node.metadata.creationTimestamp,
      addresses: node.status.addresses || []
    }));
  }

  async getPods(namespace = 'default') {
    if (!namespace) throw new Error('Namespace is required');
    await this.verifyClusterConnection();

    const res = await this.coreV1Api.listNamespacedPod(namespace);
    return res.body.items.map(pod => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      namespace: pod.metadata.namespace,
      nodeName: pod.spec.nodeName,
      startTime: pod.status.startTime,
      creationTimestamp: pod.metadata.creationTimestamp,
      labels: pod.metadata.labels || {},
      containers: pod.spec.containers?.map(c => c.name) || [],
      restarts: pod.status.containerStatuses?.reduce((acc, cs) => acc + cs.restartCount, 0) || 0
    }));
  }

  async deletePod(name, namespace = 'default') {
    if (!name || !namespace) throw new Error('Pod name and namespace are required');
    await this.verifyClusterConnection();

    await this.coreV1Api.deleteNamespacedPod(name, namespace);
    logger.info(`🗑️ Pod deleted: ${name} in namespace ${namespace}`);
    return { success: true, podName: name, namespace };
  }

  async restartPod(name, namespace = 'default') {
    if (!name || !namespace) throw new Error('Pod name and namespace are required');
    await this.verifyClusterConnection();

    const pod = await this.coreV1Api.readNamespacedPod(name, namespace);
    await this.coreV1Api.deleteNamespacedPod(name, namespace);
    logger.info(`🔄 Restarted pod: ${name} in namespace ${namespace}`);
    return {
      name: pod.body.metadata.name,
      namespace: pod.body.metadata.namespace,
      status: 'Restart initiated',
      originalPod: {
        status: pod.body.status,
        spec: {
          containers: pod.body.spec.containers?.map(c => c.name)
        }
      }
    };
  }

  async getServiceAccountInfo() {
    if (this.mode !== 'in-cluster') {
      return { mode: this.mode, message: 'ServiceAccount info only available in in-cluster mode' };
    }

    try {
      const fsSync = require('fs');
      const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
      const namespacePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      const caPath = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';

      return {
        serviceAccountTokenExists: fsSync.existsSync(tokenPath),
        namespaceFileExists: fsSync.existsSync(namespacePath),
        caCertExists: fsSync.existsSync(caPath),
        currentNamespace: fsSync.existsSync(namespacePath) ? fsSync.readFileSync(namespacePath, 'utf8').trim() : 'unknown',
        mode: this.mode
      };
    } catch (err) {
      logger.error('Failed to read ServiceAccount info', { error: err.message });
      return { error: err.message };
    }
  }

  // Deployments (kept)
  async getDeployments(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedDeployment(namespace);
    return res.body.items.map(d => ({
      name: d.metadata.name,
      namespace: d.metadata.namespace,
      replicas: d.spec.replicas,
      availableReplicas: d.status.availableReplicas || 0,
      creationTimestamp: d.metadata.creationTimestamp
    }));
  }

  // Services (kept)
  async getServices(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedService(namespace);
    return res.body.items.map(svc => ({
      name: svc.metadata.name,
      namespace: svc.metadata.namespace,
      type: svc.spec.type,
      clusterIP: svc.spec.clusterIP,
      externalIPs: svc.spec.externalIPs || [],
      ports: svc.spec.ports?.map(p => ({
        name: p.name,
        port: p.port,
        protocol: p.protocol,
        targetPort: p.targetPort
      })) || [],
      creationTimestamp: svc.metadata.creationTimestamp
    }));
  }

  // ConfigMaps (kept)
  async getConfigMaps(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedConfigMap(namespace);
    return res.body.items.map(cm => ({
      name: cm.metadata.name,
      namespace: cm.metadata.namespace,
      dataKeys: Object.keys(cm.data || {}),
      binaryDataKeys: Object.keys(cm.binaryData || {}),
      creationTimestamp: cm.metadata.creationTimestamp
    }));
  }

  // Secrets (kept)
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

  // PersistentVolumes / PVCs (kept)
  async getPersistentVolumes() {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listPersistentVolume();
    return res.body.items.map(pv => ({
      name: pv.metadata.name,
      status: pv.status.phase,
      capacity: pv.spec.capacity?.storage,
      storageClass: pv.spec.storageClassName,
      accessModes: pv.spec.accessModes,
      reclaimPolicy: pv.spec.persistentVolumeReclaimPolicy,
      creationTimestamp: pv.metadata.creationTimestamp
    }));
  }

  async getPersistentVolumeClaims(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedPersistentVolumeClaim(namespace);
    return res.body.items.map(pvc => ({
      name: pvc.metadata.name,
      namespace: pvc.metadata.namespace,
      status: pvc.status.phase,
      volumeName: pvc.spec.volumeName,
      storageClass: pvc.spec.storageClassName,
      capacity: pvc.status.capacity?.storage,
      accessModes: pvc.spec.accessModes,
      creationTimestamp: pvc.metadata.creationTimestamp
    }));
  }

  // StatefulSets (kept)
  async getStatefulSets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedStatefulSet(namespace);
    return res.body.items.map(ss => ({
      name: ss.metadata.name,
      namespace: ss.metadata.namespace,
      replicas: ss.status.replicas || 0,
      readyReplicas: ss.status.readyReplicas || 0,
      serviceName: ss.spec.serviceName,
      creationTimestamp: ss.metadata.creationTimestamp
    }));
  }

  // DaemonSets (kept)
  async getDaemonSets(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.appsV1Api.listNamespacedDaemonSet(namespace);
    return res.body.items.map(ds => ({
      name: ds.metadata.name,
      namespace: ds.metadata.namespace,
      currentNumberScheduled: ds.status.currentNumberScheduled,
      desiredNumberScheduled: ds.status.desiredNumberScheduled,
      numberReady: ds.status.numberReady,
      creationTimestamp: ds.metadata.creationTimestamp
    }));
  }

  // Jobs & CronJobs (kept)
  async getJobs(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.batchV1Api.listNamespacedJob(namespace);
    return res.body.items.map(job => ({
      name: job.metadata.name,
      namespace: job.metadata.namespace,
      completions: job.spec.completions,
      parallelism: job.spec.parallelism,
      succeeded: job.status.succeeded || 0,
      active: job.status.active || 0,
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
      lastScheduleTime: cj.status.lastScheduleTime,
      creationTimestamp: cj.metadata.creationTimestamp
    }));
  }

  async getIngresses(namespace = 'default') {
    await this.verifyClusterConnection();
    const res = await this.networkingV1Api.listNamespacedIngress(namespace);
    return res.body.items.map(ing => ({
      name: ing.metadata.name,
      namespace: ing.metadata.namespace,
      hosts: ing.spec.rules?.map(r => r.host) || [],
      creationTimestamp: ing.metadata.creationTimestamp
    }));
  }

  // ======================
  // Enhanced Pod Operations (existing enhanced ones)
  // ======================
  async getPodsWithStatus(namespace = 'default', statusFilter) {
    await this.verifyClusterConnection();
    const res = await this.coreV1Api.listNamespacedPod(namespace);

    return res.body.items
      .filter(pod => !statusFilter || pod.status.phase === statusFilter)
      .map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status.phase,
        nodeName: pod.spec.nodeName,
        restarts: pod.status.containerStatuses?.reduce((acc, cs) => acc + cs.restartCount, 0) || 0,
        conditions: pod.status.conditions,
        createdAt: pod.metadata.creationTimestamp
      }));
  }

  async streamPodLogs(name, namespace = 'default', tailLines = 100) {
    await this.verifyClusterConnection();
    return this.coreV1Api.readNamespacedPodLog(
      name,
      namespace,
      undefined, // container
      true,     // follow (stream)
      undefined,
      undefined,
      undefined,
      tailLines,
      true       // timestamps
    );
  }

  // NOTE: deletePod & restartPod already exist above and kept.

  // ======================
  // Deployment Operations (existing scale)
  // ======================
  async scaleDeployment(name, namespace = 'default', replicas) {
    await this.verifyClusterConnection();
    if (replicas < 0 || replicas > 1000) throw new Error('Replicas must be a reasonable number');
    await this.appsV1Api.patchNamespacedDeploymentScale(
      name,
      namespace,
      { spec: { replicas: parseInt(replicas) } },
      undefined, undefined, undefined, undefined, 'StrategicMergePatch'
    );
    logger.info(`⚖️ Scaled ${namespace}/${name} to ${replicas} replicas`);
    return { success: true };
  }

  // ======================
  // Helper: sorting utility for formatted endpoints
  // ======================
  _sortData(data, sortBy, sortOrder = 'asc') {
    if (!sortBy) return data;
    const order = (sortOrder || 'asc').toLowerCase();
    return [...data].sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A == null && B == null) return 0;
      if (A == null) return order === 'desc' ? 1 : -1;
      if (B == null) return order === 'desc' ? -1 : 1;
      if (typeof A === 'number' && typeof B === 'number') {
        return order === 'desc' ? B - A : A - B;
      }
      const aStr = String(A).toLowerCase();
      const bStr = String(B).toLowerCase();
      if (aStr < bStr) return order === 'desc' ? 1 : -1;
      if (aStr > bStr) return order === 'desc' ? -1 : 1;
      return 0;
    });
  }

  // ======================
  // New: Formatted summary endpoints
  // ======================

  /**
   * getPodsFormatted
   * supports:
   * - namespace = '*' for all namespaces
   * - filters: { status, errorPodsOnly }
   * - sortBy, sortOrder
   */
  async getPodsFormatted(namespace = 'default', filters = {}, sortBy = null, sortOrder = 'asc') {
    await this.verifyClusterConnection();
    let res;
    if (namespace === '*') {
      res = await this.coreV1Api.listPodForAllNamespaces();
    } else {
      res = await this.coreV1Api.listNamespacedPod(namespace);
    }

    let pods = res.body.items || [];

    if (filters.status) {
      pods = pods.filter(p => (p.status.phase || '').toLowerCase() === String(filters.status).toLowerCase());
    }

    if (filters.errorPodsOnly) {
      pods = pods.filter(p => (p.status.phase || '').toLowerCase() !== 'running');
    }

    const totalPods = pods.length;
    const errorPods = pods.filter(p => (p.status?.phase || '').toLowerCase() !== 'running').length;

    let data = pods.map(p => ({
      name: p.metadata.name,
      namespace: p.metadata.namespace,
      status: p.status.phase,
      nodeName: p.spec.nodeName,
      startTime: p.status.startTime,
      age: p.metadata.creationTimestamp,
      restarts: p.status.containerStatuses?.reduce((acc, cs) => acc + cs.restartCount, 0) || 0,
      containers: p.spec.containers?.map(c => c.name) || [],
      actions: [
        { label: 'Restart', method: 'POST', endpoint: `/api/k8s/pods/${encodeURIComponent(p.metadata.name)}/restart?namespace=${encodeURIComponent(p.metadata.namespace)}` },
        { label: 'Delete', method: 'DELETE', endpoint: `/api/k8s/pods/${encodeURIComponent(p.metadata.name)}?namespace=${encodeURIComponent(p.metadata.namespace)}` },
        { label: 'Logs', method: 'GET', endpoint: `/api/k8s/pods/${encodeURIComponent(p.metadata.name)}/logs?namespace=${encodeURIComponent(p.metadata.namespace)}` }
      ]
    }));

    data = this._sortData(data, sortBy, sortOrder);

    return formatK8sResponse({
      filters: { namespace, ...filters, sortBy, sortOrder },
      summary: { totalPods, errorPods },
      data
    });
  }

  /**
   * getDeploymentsFormatted
   * supports namespace='*', sorting
   */
  async getDeploymentsFormatted(namespace = 'default', sortBy = null, sortOrder = 'asc') {
    await this.verifyClusterConnection();
    let res;
    if (namespace === '*') {
      res = await this.appsV1Api.listDeploymentForAllNamespaces();
    } else {
      res = await this.appsV1Api.listNamespacedDeployment(namespace);
    }

    const deployments = res.body.items || [];

    const total = deployments.length;
    const unavailable = deployments.filter(d => (d.status.unavailableReplicas || 0) > 0).length;

    let data = deployments.map(d => ({
      name: d.metadata.name,
      namespace: d.metadata.namespace,
      desired: d.spec.replicas,
      available: d.status.availableReplicas || 0,
      ready: d.status.readyReplicas || 0,
      strategy: d.spec.strategy?.type || 'RollingUpdate',
      creationTimestamp: d.metadata.creationTimestamp,
      actions: [
        { label: 'Restart', method: 'POST', endpoint: `/api/k8s/deployments/${encodeURIComponent(d.metadata.name)}/restart?namespace=${encodeURIComponent(d.metadata.namespace)}` },
        { label: 'Scale', method: 'PATCH', endpoint: `/api/k8s/deployments/${encodeURIComponent(d.metadata.name)}/scale` }
      ]
    }));

    data = this._sortData(data, sortBy, sortOrder);

    return formatK8sResponse({
      filters: { namespace, sortBy, sortOrder },
      summary: { total, unavailable },
      data
    });
  }

  /**
   * getServicesFormatted
   */
  async getServicesFormatted(namespace = 'default', sortBy = null, sortOrder = 'asc') {
    await this.verifyClusterConnection();
    let res;
    if (namespace === '*') {
      res = await this.coreV1Api.listServiceForAllNamespaces();
    } else {
      res = await this.coreV1Api.listNamespacedService(namespace);
    }

    const services = res.body.items || [];
    const total = services.length;

    let data = services.map(s => ({
      name: s.metadata.name,
      namespace: s.metadata.namespace,
      type: s.spec.type,
      clusterIP: s.spec.clusterIP,
      ports: s.spec.ports || [],
      creationTimestamp: s.metadata.creationTimestamp,
      actions: [
        // No destructive actions by default for services; UI can decide.
      ]
    }));

    data = this._sortData(data, sortBy, sortOrder);

    return formatK8sResponse({
      filters: { namespace, sortBy, sortOrder },
      summary: { total },
      data
    });
  }

  // ======================
  // Helm: list & actions via native CLI
  // - helm list --output json
  // - helm upgrade ...
  // - helm rollback ...
  // - helm uninstall ...
  // ======================

  async getHelmReleasesFormatted(namespace = 'default', sortBy = null, sortOrder = 'asc') {
    try {
      // namespace='*' => all namespaces
      const nsFlag = namespace === '*' ? '--all-namespaces' : `--namespace ${namespace}`;
      const { stdout } = await execAsync(`helm list ${nsFlag} --output json`);
      const releases = JSON.parse(stdout || '[]');

      const total = releases.length;

      let data = (releases || []).map(r => ({
        name: r.name,
        namespace: r.namespace,
        revision: r.revision,
        updated: r.updated,
        status: r.status,
        chart: r.chart,
        appVersion: r.app_version || r.appVersion || null,
        actions: [
          { type: 'upgrade', label: 'Upgrade', method: 'POST', endpoint: `/api/k8s/helm/${encodeURIComponent(r.name)}/upgrade?namespace=${encodeURIComponent(r.namespace)}` },
          { type: 'rollback', label: 'Rollback', method: 'POST', endpoint: `/api/k8s/helm/${encodeURIComponent(r.name)}/rollback?namespace=${encodeURIComponent(r.namespace)}` },
          { type: 'delete', label: 'Delete', method: 'DELETE', endpoint: `/api/k8s/helm/${encodeURIComponent(r.name)}?namespace=${encodeURIComponent(r.namespace)}` }
        ]
      }));

      data = this._sortData(data, sortBy, sortOrder);

      return formatK8sResponse({
        filters: { namespace, sortBy, sortOrder },
        summary: { total },
        data
      });
    } catch (err) {
      logger.error('Helm list failed', { error: err.message });
      return formatK8sResponse({
        status: 'error',
        filters: { namespace },
        summary: {},
        data: [],
        errors: [err.message]
      });
    }
  }

  /**
   * helmUpgrade
   * body should contain: { chart, valuesFile?, additionalArgs? }
   * chart may be name (repo/chart) or path
   */
  async helmUpgrade(releaseName, namespace = 'default', { chart, valuesFile, additionalArgs } = {}) {
    if (!releaseName || !chart) throw new Error('releaseName and chart required for upgrade');
    try {
      const nsFlag = `--namespace ${namespace}`;
      const valuesFlag = valuesFile ? `-f ${valuesFile}` : '';
      const extra = additionalArgs || '';
      // `helm upgrade --install releaseName chart ...`
      const cmd = `helm upgrade --install ${releaseName} ${chart} ${nsFlag} ${valuesFlag} ${extra} --wait --timeout 300s --output json`;
      const { stdout } = await execAsync(cmd);
      // try to parse stdout if JSON; sometimes helm prints human-readable text
      let result = stdout;
      try {
        result = JSON.parse(stdout);
      } catch (parseErr) {
        // keep raw output
      }
      logger.info(`Helm upgrade called for ${releaseName} (${namespace})`);
      return formatK8sResponse({
        filters: { releaseName, namespace },
        summary: {},
        data: [{ raw: result }]
      });
    } catch (err) {
      logger.error('Helm upgrade failed', { error: err.message });
      return formatK8sResponse({
        status: 'error',
        filters: { releaseName, namespace },
        summary: {},
        data: [],
        errors: [err.message]
      });
    }
  }

  /**
   * helmRollback
   * body: { revision }
   */
  async helmRollback(releaseName, namespace = 'default', { revision } = {}) {
    if (!releaseName) throw new Error('releaseName required for rollback');
    try {
      const nsFlag = namespace ? `--namespace ${namespace}` : '';
      const revFlag = revision ? `${revision}` : '';
      const cmd = revFlag ? `helm rollback ${releaseName} ${revFlag} ${nsFlag}` : `helm rollback ${releaseName} ${nsFlag}`;
      const { stdout } = await execAsync(cmd);
      logger.info(`Helm rollback called for ${releaseName} (${namespace})`);
      return formatK8sResponse({
        filters: { releaseName, namespace, revision },
        summary: {},
        data: [{ raw: stdout }]
      });
    } catch (err) {
      logger.error('Helm rollback failed', { error: err.message });
      return formatK8sResponse({
        status: 'error',
        filters: { releaseName, namespace, revision },
        summary: {},
        data: [],
        errors: [err.message]
      });
    }
  }

  /**
   * helmDelete
   */
  async helmDelete(releaseName, namespace = 'default') {
    if (!releaseName) throw new Error('releaseName required for delete');
    try {
      const nsFlag = namespace ? `--namespace ${namespace}` : '';
      const cmd = `helm uninstall ${releaseName} ${nsFlag}`;
      const { stdout } = await execAsync(cmd);
      logger.info(`Helm uninstall called for ${releaseName} (${namespace})`);
      return formatK8sResponse({
        filters: { releaseName, namespace },
        summary: {},
        data: [{ raw: stdout }]
      });
    } catch (err) {
      logger.error('Helm uninstall failed', { error: err.message });
      return formatK8sResponse({
        status: 'error',
        filters: { releaseName, namespace },
        summary: {},
        data: [],
        errors: [err.message]
      });
    }
  }
} // end class

// Singleton export
const k8sService = new K8sService();
await k8sService.init().catch(err => {
  logger.error('❌ Failed to initialize Kubernetes service', { error: err.message });
  process.exit(1);
});

export default k8sService;
