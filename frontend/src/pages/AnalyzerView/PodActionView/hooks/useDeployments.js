import { useState, useEffect, useRef } from 'react';

export default function useDeployments(namespace = 'default') {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`/api/k8s/deployments?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDeployments(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      stopPolling();
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (interval = 5000) => {
    stopPolling();
    fetchDeployments();
    pollingInterval.current = setInterval(fetchDeployments, interval);
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

  const scaleDeployment = async (name, replicas) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/k8s/deployments/${name}/scale?namespace=${namespace}`,
        {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ replicas: parseInt(replicas) })
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchDeployments();
      return true;
    } catch (err) {
      setError(`Scale failed: ${err.message}`);
      return false;
    }
  };

  const restartDeployment = async (name) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/k8s/deployments/${name}/restart?namespace=${namespace}`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchDeployments();
      return true;
    } catch (err) {
      setError(`Restart failed: ${err.message}`);
      return false;
    }
  };

  return {
    deployments,
    isLoading,
    error,
    lastUpdated,
    scaleDeployment,
    restartDeployment,
    refresh: fetchDeployments,
    startPolling,
    stopPolling
  };
}