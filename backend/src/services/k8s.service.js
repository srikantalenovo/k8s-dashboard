import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import logger from '../utils/logger.js';
import fs from 'fs/promises'; // Using fs promises API for async file operations

class K8sService {
  constructor() {
    this.kc = new KubeConfig();
    this.coreV1Api = null;
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
    
    // Add timeout configuration safely
    if (this.coreV1Api && this.coreV1Api.defaults) {
      this.coreV1Api.defaults.timeout = 10000; // 10 second timeout
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
      const fs = require('fs');
      const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
      const namespacePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      const caPath = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
      
      return {
        serviceAccountTokenExists: fs.existsSync(tokenPath),
        namespaceFileExists: fs.existsSync(namespacePath),
        caCertExists: fs.existsSync(caPath),
        currentNamespace: fs.existsSync(namespacePath) ? fs.readFileSync(namespacePath, 'utf8').trim() : 'unknown',
        mode: this.mode
      };
    } catch (err) {
      logger.error('Failed to read ServiceAccount info', { error: err.message });
      return { error: err.message };
    }
  }
}

// Singleton export
// Initialize and export as singleton
const k8sService = new K8sService();
await k8sService.init().catch(err => {
  logger.error('❌ Failed to initialize Kubernetes service', { error: err.message });
  process.exit(1);
});

export default k8sService;