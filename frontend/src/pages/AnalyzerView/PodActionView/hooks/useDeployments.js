import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket';

export default function useDeployments(namespace = 'default') {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeployments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/k8s/deployments?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      setDeployments(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { lastJsonMessage, readyState } = useWebSocket(
    `ws://${window.location.host}/api/k8s/deployments/watch?namespace=${namespace}`,
    {
      shouldReconnect: () => true,
      reconnectInterval: 3000,
      onError: (err) => {
        console.error('Deployments WS error:', err);
        fetchDeployments();
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

  useEffect(() => {
    if (lastJsonMessage) {
      setDeployments(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    fetchDeployments();
  }, [namespace]);

  const scaleDeployment = async (name, replicas) => {
    try {
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

  return {
    deployments,
    isLoading,
    error,
    wsReadyState: readyState,
    scaleDeployment,
    refresh: fetchDeployments
  };
}