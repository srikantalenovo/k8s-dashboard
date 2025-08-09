import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function useHelm(namespace = 'default') {
  const { user: currentUser, token } = useAuth();
  const [state, setState] = useState({
    releases: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const pollingInterval = useRef(null);

  const hasPermission = useCallback((action) => {
    if (!token || !currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.some(perm => 
      (perm.resource === 'helm' || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );
  }, [currentUser, token]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  const fetchReleases = useCallback(async () => {
    if (!hasPermission('read')) {
      setState(prev => ({ ...prev, 
        releases: [],
        error: 'Missing read permissions for Helm',
        isLoading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      const response = await api.get(`/helm/releases?${params.toString()}`);
      
      if (typeof response.data === 'string' && response.data.startsWith('<!DOCTYPE html>')) {
        throw new Error('Server returned HTML instead of JSON');
      }

      const releasesData = Array.isArray(response.data) ? response.data : [response.data];
      const releasesWithIds = releasesData.map((release, index) => ({
        ...release,
        id: release.name || `release-${namespace}-${index}-${Date.now()}`
      }));

      setState(prev => ({
        ...prev,
        releases: releasesWithIds,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 
              (err.message.includes('HTML') ? 'API endpoint misconfigured' : 'Failed to fetch releases')
      }));
      stopPolling();
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [namespace, hasPermission, stopPolling]);

  const startPolling = useCallback((interval = 10000) => {
    stopPolling();
    fetchReleases();
    pollingInterval.current = setInterval(fetchReleases, interval);
  }, [fetchReleases, stopPolling]);

  const helmAction = useCallback(async (action, releaseName, payload = {}) => {
    if (!hasPermission(action)) {
      setState(prev => ({ ...prev, 
        error: `Insufficient permissions to ${action} releases`
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const params = new URLSearchParams({ namespace });
      await api.post(
        `/helm/releases/${releaseName}/${action}?${params.toString()}`,
        payload
      );
      await fetchReleases();
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || `${action} operation failed`
      }));
      return false;
    }
  }, [namespace, hasPermission, fetchReleases]);

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