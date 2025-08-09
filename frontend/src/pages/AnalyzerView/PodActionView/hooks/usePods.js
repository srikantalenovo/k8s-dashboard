import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function usePods(namespace = 'default') {
  const { user: currentUser, token } = useAuth();
  const [state, setState] = useState({
    pods: [],
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
      (perm.resource === 'pods' || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser, token]);

  // 1. First declare stopPolling (no dependencies)
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // 2. Then fetchPods (depends on stopPolling)
  const fetchPods = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        pods: [],
        error: 'Missing read permissions for pods',
        isLoading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/pods?${params.toString()}`);
      setState(prev => ({
        ...prev,
        pods: Array.isArray(data) ? data : [data],
        lastUpdated: new Date(),
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to fetch pods'
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling]);

  // 3. Then startPolling (depends on both)
  const startPolling = useCallback((interval = 5000) => {
    stopPolling();
    fetchPods();
    pollingInterval.current = setInterval(fetchPods, interval);
  }, [fetchPods, stopPolling]);

  // Pod actions
  const podAction = useCallback(async (action, podName, method = 'POST') => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} pods`
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      await api({
        method,
        url: `/k8s/pods/${podName}${action !== 'delete' ? `/${action}` : ''}?${params.toString()}`
      });
      await fetchPods();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || `${action} operation failed`
      }));
      return false;
    }
  }, [namespace, hasPermission, fetchPods]);

  // Initialize
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