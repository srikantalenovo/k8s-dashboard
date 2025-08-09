import { useState, useEffect, useRef, useCallback } from 'react';
import useNamespaces from './useNamespaces';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function useDeployments(initialNamespace = 'default') {
  const { user: currentUser, token } = useAuth();
  const { namespaces, loading: nsLoading, error: nsError, hasAccess } = useNamespaces();
  const [namespace, setNamespace] = useState(initialNamespace);
  const [state, setState] = useState({
    deployments: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  const hasPermission = useCallback((action) => {
    if (!token || !currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(perm => 
      (perm.resource === 'deployments' || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser, token]);

  const stopPolling = useCallback(() => {
    pollingInterval.current && clearInterval(pollingInterval.current);
    pollingInterval.current = null;
  }, []);

  const fetchDeployments = useCallback(async () => {
    if (!hasAccess(namespace)) {
      setState(prev => ({ ...prev, 
        deployments: [],
        error: `No access to namespace ${namespace}`,
        isLoading: false
      }));
      return;
    }

    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        deployments: [],
        error: 'Missing read permissions for deployments',
        isLoading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/deployments?${params.toString()}`);
      
      const deploymentsWithIds = (Array.isArray(data) ? data : [data]).map((deployment, index) => ({
        ...deployment,
        id: deployment.metadata?.uid || deployment.metadata?.name || `deploy-${namespace}-${index}-${Date.now()}`
      }));

      setState(prev => ({
        ...prev,
        deployments: deploymentsWithIds,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to fetch deployments',
        deployments: []
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling, hasAccess]);

  const startPolling = useCallback((interval = 8000) => {
    stopPolling();
    fetchDeployments();
    pollingInterval.current = setInterval(fetchDeployments, interval);
  }, [fetchDeployments, stopPolling]);

  const deploymentAction = useCallback(async (action, name, payload = {}) => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, error: `Insufficient permissions to ${action} deployments` }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      const method = action === 'delete' ? 'DELETE' : 'POST';
      await api({
        method,
        url: `/k8s/deployments/${name}${action !== 'delete' ? `/${action}` : ''}?${params.toString()}`,
        data: payload
      });
      await fetchDeployments();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || `${action} operation failed`
      }));
      return false;
    }
  }, [namespace, hasPermission, fetchDeployments]);

  useEffect(() => {
    if (namespaces.length > 0 && !namespaces.includes(namespace)) {
      setNamespace(namespaces[0]);
    }
  }, [namespaces, namespace]);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return {
    ...state,
    namespaces,
    namespace,
    setNamespace,
    nsLoading,
    nsError,
    scaleDeployment: (name, replicas) => 
      deploymentAction('scale', name, { replicas }),
    restartDeployment: (name) => deploymentAction('restart', name),
    updateDeployment: (name, image) => 
      deploymentAction('update', name, { image }),
    deleteDeployment: (name) => deploymentAction('delete', name),
    refresh: fetchDeployments,
    startPolling,
    stopPolling
  };
}