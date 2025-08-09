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

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

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
      const response = await api.get(`/k8s/pods?${params.toString()}`);
      
      // Validate response is not HTML
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html>')) {
        throw new Error('Server returned HTML instead of JSON');
      }

      // Ensure all pods have IDs
      const podsData = Array.isArray(response.data) ? response.data : [response.data];
      const podsWithIds = podsData.map((pod, index) => ({
        ...pod,
        id: pod.metadata?.uid || pod.metadata?.name || `pod-${namespace}-${index}-${Date.now()}`
      }));

      setState(prev => ({
        ...prev,
        pods: podsWithIds,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 
              (err.message.includes('HTML') ? 'API endpoint misconfigured' : 'Failed to fetch pods')
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling]);

  const startPolling = useCallback((interval = 5000) => {
    stopPolling();
    fetchPods();
    pollingInterval.current = setInterval(fetchPods, interval);
  }, [fetchPods, stopPolling]);

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