import { useState, useEffect, useRef, useCallback } from 'react';
import useNamespaces from './useNamespaces';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function usePods(initialNamespace = 'default') {
  const { user: currentUser, token } = useAuth();
  const { namespaces, loading: nsLoading, error: nsError, hasAccess } = useNamespaces();
  const [namespace, setNamespace] = useState(initialNamespace);
  const [state, setState] = useState({
    pods: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  const hasPermission = useCallback((action) => {
    if (!token || !currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(perm => 
      (perm.resource === 'pods' || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser, token]);

  const stopPolling = useCallback(() => {
    pollingInterval.current && clearInterval(pollingInterval.current);
    pollingInterval.current = null;
  }, []);

  const fetchPods = useCallback(async () => {
    if (!hasAccess(namespace)) {
      setState(prev => ({ ...prev, 
        pods: [],
        error: `No access to namespace ${namespace}`,
        isLoading: false
      }));
      return;
    }

    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        pods: [],
        error: 'Missing read permissions for pods',
        isLoading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/k8s/pods?${params.toString()}`);
      
      const podsWithIds = (Array.isArray(data) ? data : [data]).map((pod, index) => ({
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
        error: err.response?.data?.message || 'Failed to fetch pods',
        pods: []
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling, hasAccess]);

  const startPolling = useCallback((interval = 5000) => {
    stopPolling();
    fetchPods();
    pollingInterval.current = setInterval(fetchPods, interval);
  }, [fetchPods, stopPolling]);

  const podAction = useCallback(async (action, podName, method = 'POST') => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, error: `Insufficient permissions to ${action} pods` }));
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
    // Reset to first available namespace if current becomes invalid
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
    deletePod: (podName) => podAction('delete', podName, 'DELETE'),
    restartPod: (podName) => podAction('restart', podName),
    refresh: fetchPods,
    startPolling,
    stopPolling
  };
}