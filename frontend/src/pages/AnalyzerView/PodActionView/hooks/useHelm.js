import { useState, useEffect, useRef } from 'react';

export default function useHelm(namespace = 'default') {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReleases = async () => {
    try {
      const res = await fetch(`/api/k8s/helm/releases?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReleases(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      stopPolling();
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (interval = 10000) => { // Longer interval for Helm
    stopPolling();
    fetchReleases();
    pollingInterval.current = setInterval(fetchReleases, interval);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [namespace]);

  const uninstallRelease = async (releaseName) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/k8s/helm/releases/${releaseName}?namespace=${namespace}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchReleases();
      return true;
    } catch (err) {
      setError(`Uninstall failed: ${err.message}`);
      return false;
    }
  };

  return {
    releases,
    isLoading,
    error,
    lastUpdated,
    uninstallRelease,
    refresh: fetchReleases,
    startPolling,
    stopPolling
  };
}