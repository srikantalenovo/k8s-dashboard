import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

export default function useNamespaces() {
  const { user: currentUser, token } = useAuth();
  const [state, setState] = useState({
    namespaces: ['default'],
    loading: false,
    error: null
  });

  const fetchNamespaces = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'Not authenticated', namespaces: ['default'] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await api.get('/api/k8s/namespaces');
      
      // Handle multiple response formats
      const processedNamespaces = (Array.isArray(data) ? data : [data])
        .map(ns => ns.metadata?.name || ns.name || ns)
        .filter(Boolean)
        .filter(ns => {
          if (currentUser?.role === 'admin') return true;
          return currentUser?.allowedNamespaces?.includes(ns) ?? true;
        });

      setState(prev => ({
        ...prev,
        namespaces: processedNamespaces.length ? processedNamespaces : ['default'],
        error: null
      }));
    } catch (err) {
      console.error('Namespace fetch error:', err);
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to fetch namespaces',
        namespaces: currentUser?.allowedNamespaces || ['default']
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [token, currentUser]);

  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  return {
    namespaces: state.namespaces,
    loading: state.loading,
    error: state.error,
    refresh: fetchNamespaces,
    hasAccess: (namespace) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      return currentUser.allowedNamespaces?.includes(namespace) ?? true;
    }
  };
}