import { useState, useEffect, useRef } from 'react';

export default function usePods(namespace = 'default') {
  const [pods, setPods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Main fetch function
  const fetchPods = async () => {
    try {
      const res = await fetch(`/api/k8s/pods?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPods(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      stopPolling();
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling with cleanup
  const startPolling = (interval = 5000) => {
    stopPolling(); // Clear existing interval
    fetchPods(); // Immediate fetch
    pollingInterval.current = setInterval(fetchPods, interval);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Initialize and cleanup
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [namespace]);

  // Pod actions
  const deletePod = async (podName) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/k8s/pods/${podName}?namespace=${namespace}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchPods(); // Refresh data
      return true;
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
      return false;
    }
  };

  const restartPod = async (podName) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/k8s/pods/${podName}/restart?namespace=${namespace}`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchPods(); // Refresh data
      return true;
    } catch (err) {
      setError(`Restart failed: ${err.message}`);
      return false;
    }
  };

  return {
    pods,
    isLoading,
    error,
    lastUpdated,
    deletePod,
    restartPod,
    refresh: fetchPods,
    startPolling,
    stopPolling
  };
}