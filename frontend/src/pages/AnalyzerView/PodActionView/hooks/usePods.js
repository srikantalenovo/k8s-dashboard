import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../services/api';

export default function usePods(namespace = 'default', currentUser) {
  const [state, setState] = useState({
    pods: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  // Permission check (reusable)
  const hasPermission = useCallback((action) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(
      perm => 
        (perm.resource === 'pods' || perm.resource === '*') &&
        (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser]);

  // Unified API error handler
  const handleApiError = (error, defaultMessage) => {
    console.error('API Error:', error);
    return error.response?.data?.message || error.message || defaultMessage;
  };

  // Main fetch with error handling and permissions
  const fetchPods = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        error: 'Insufficient permissions to view pods',
        isLoading: false 
      }));
      return;
    }

    try {
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/pods?${params.toString()}`);
      setState(prev => ({
        ...prev,
        pods: Array.isArray(data) ? data : [data],
        error: null,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err, 'Failed to fetch pods')
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission]);

  // Polling control
  const startPolling = useCallback((interval = 5000) => {
    stopPolling();
    fetchPods();
    pollingInterval.current = setInterval(fetchPods, interval);
  }, [fetchPods]);

  const stopPolling = useCallback(() => {
    clearInterval(pollingInterval.current);
    pollingInterval.current = null;
  }, []);

  // Action handlers
  const podAction = async (action, podName, method = 'POST') => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} pods` 
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      const url = `/k8s/pods/${podName}${action !== 'delete' ? `/${action}` : ''}`;
      
      await api({
        method,
        url: `${url}?${params.toString()}`
      });

      await fetchPods();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err, `${action} operation failed`)
      }));
      return false;
    }
  };

  // Initialize and cleanup
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return {
    ...state,
    deletePod: (podName) => podAction('delete', podName, 'DELETE'),
    restartPod: (podName) => podAction('restart', podName),
    refresh: fetchPods,
    startPolling,
    stopPolling
  };
}