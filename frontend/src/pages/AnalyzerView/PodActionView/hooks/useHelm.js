import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket';

export default function useHelm(namespace = 'default') {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // REST fallback
  const fetchReleases = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/k8s/helm/releases?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReleases(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket(
    `ws://${window.location.host}/api/k8s/helm/watch?namespace=${namespace}`,
    {
      onOpen: () => console.log('Helm WS connected'),
      onError: (err) => {
        console.error('Helm WS error:', err);
        fetchReleases(); // Fallback to REST
      },
      shouldReconnect: () => true,
      reconnectInterval: 3000,
    }
  );

  useEffect(() => {
    if (lastMessage?.data) {
      setReleases(JSON.parse(lastMessage.data));
      setLastUpdated(new Date());
    }
  }, [lastMessage]);

  useEffect(() => {
    fetchReleases();
  }, [namespace]);

  const uninstallRelease = async (releaseName) => {
    try {
      await fetch(`/api/k8s/helm/releases/${releaseName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchReleases(); // Refresh data
    } catch (err) {
      setError(`Uninstall failed: ${err.message}`);
    }
  };

  return {
    releases,
    isLoading,
    error,
    lastUpdated,
    uninstallRelease,
    refresh: fetchReleases,
  };
}