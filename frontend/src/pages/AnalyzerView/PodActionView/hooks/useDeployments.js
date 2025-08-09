import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../services/api';

export default function useDeployments(namespace = 'default', currentUser) {
  const [state, setState] = useState({
    deployments: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  // Permission check
  const hasPermission = useCallback((action) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(
      perm => 
        (perm.resource === 'deployments' || perm.resource === '*') &&
        (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser]);

  // Error handler
  const handleApiError = (error, defaultMessage) => {
    console.error('Deployments API Error:', error);
    return error.response?.data?.message || error.message || defaultMessage;
  };

  // Fetch deployments
  const fetchDeployments = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        error: 'Insufficient permissions to view deployments',
        isLoading: false 
      }));
      return;
    }

    try {
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/deployments?${params.toString()}`);
      setState(prev => ({
        ...prev,
        deployments: Array.isArray(data) ? data : [data],
        error: null,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err, 'Failed to fetch deployments')
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission]);

  // Polling control
  const startPolling = useCallback((interval = 8000) => {
    stopPolling();
    fetchDeployments();
    pollingInterval.current = setInterval(fetchDeployments, interval);
  }, [fetchDeployments]);

  const stopPolling = useCallback(() => {
    clearInterval(pollingInterval.current);
    pollingInterval.current = null;
  }, []);

  // Deployment actions
  const deploymentAction = async (action, deploymentName, payload = {}) => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} deployments` 
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      
      await api({
        method: action === 'delete' ? 'DELETE' : 'POST',
        url: `/k8s/deployments/${deploymentName}${
          action !== 'delete' ? `/${action}` : ''
        }?${params.toString()}`,
        data: payload
      });

      await fetchDeployments();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err, `${action} operation failed`)
      }));
      return false;
    }
  };

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