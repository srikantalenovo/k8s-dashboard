import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../services/api';

export default function useHelm(namespace = 'default', currentUser) {
  const [state, setState] = useState({
    releases: [],
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
        (perm.resource === 'helm' || perm.resource === '*') &&
        (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser]);

  // Error handler
  const handleApiError = (error, defaultMessage) => {
    console.error('Helm API Error:', error);
    return error.response?.data?.message || error.message || defaultMessage;
  };

  // Fetch Helm releases
  const fetchReleases = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        error: 'Insufficient permissions to view Helm releases',
        isLoading: false 
      }));
      return;
    }

    try {
      const params = new URLSearchParams({ namespace });
      const { data } = await api.get(`/helm/releases?${params.toString()}`);
      setState(prev => ({
        ...prev,
        releases: Array.isArray(data) ? data : [data],
        error: null,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: handleApiError(err, 'Failed to fetch Helm releases')
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission]);

  // Polling control
  const startPolling = useCallback((interval = 10000) => {
    stopPolling();
    fetchReleases();
    pollingInterval.current = setInterval(fetchReleases, interval);
  }, [fetchReleases]);

  const stopPolling = useCallback(() => {
    clearInterval(pollingInterval.current);
    pollingInterval.current = null;
  }, []);

  // Helm actions
  const helmAction = async (action, releaseName, payload = {}) => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} Helm releases` 
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      
      await api({
        method: 'POST',
        url: `/helm/releases/${releaseName}/${action}?${params.toString()}`,
        data: payload
      });

      await fetchReleases();
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
    installRelease: (name, chart, values) => 
      helmAction('install', name, { chart, values }),
    upgradeRelease: (name, chart, values) => 
      helmAction('upgrade', name, { chart, values }),
    uninstallRelease: (name) => helmAction('uninstall', name),
    rollbackRelease: (name, revision) => 
      helmAction('rollback', name, { revision }),
    refresh: fetchReleases,
    startPolling,
    stopPolling
  };
}