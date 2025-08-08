import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket';

export default function useHelm(namespace = 'default') {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // REST fallback
  const fetchReleases = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/k8s/helm/releases?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      setReleases(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket connection
  const { lastJsonMessage, readyState } = useWebSocket(
    `ws://${window.location.host}/api/k8s/helm/watch?namespace=${namespace}`,
    {
      shouldReconnect: () => true,
      reconnectInterval: 3000,
      onError: (err) => {
        console.error('Helm WS error:', err);
        fetchReleases(); // Fallback to REST
      },
      filter: (message) => {
        try {
          JSON.parse(message.data);
          return true;
        } catch {
          return false;
        }
      }
    }
  );

  // Update state when WS messages arrive
  useEffect(() => {
    if (lastJsonMessage) {
      setReleases(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  // Initial fetch
  useEffect(() => {
    fetchReleases();
  }, [namespace]);

  const uninstallRelease = async (releaseName) => {
    try {
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
    wsReadyState: readyState,
    uninstallRelease,
    refresh: fetchReleases
  };
}