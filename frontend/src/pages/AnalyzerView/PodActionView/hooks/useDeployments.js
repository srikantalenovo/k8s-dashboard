import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function useDeployments(namespace = 'default') {
  const { user: currentUser, token } = useAuth();
  const [state, setState] = useState({
    deployments: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  // Permission check
  const hasPermission = useCallback((action) => {
    if (!token || !currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(perm => 
      (perm.resource === 'deployments' || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser, token]);

  // 1. Stop polling (no deps)
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // 2. Fetch deployments
  const fetchDeployments = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        deployments: [],
        error: 'Missing read permissions for deployments',
        isLoading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/deployments?${params.toString()}`);
      setState(prev => ({
        ...prev,
        deployments: Array.isArray(data) ? data : [data],
        lastUpdated: new Date(),
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to fetch deployments'
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling]);

  // 3. Start polling
  const startPolling = useCallback((interval = 8000) => {
    stopPolling();
    fetchDeployments();
    pollingInterval.current = setInterval(fetchDeployments, interval);
  }, [fetchDeployments, stopPolling]);

  // Deployment actions
  const deploymentAction = useCallback(async (action, name, payload = {}) => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} deployments`
      }));
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

  // Initialize
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return {
    ...state,
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