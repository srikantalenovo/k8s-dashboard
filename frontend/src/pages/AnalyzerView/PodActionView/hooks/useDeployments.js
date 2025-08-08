import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket';

export default function useDeployments(namespace = 'default') {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const fetchDeployments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/k8s/deployments?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDeployments(data);
    } catch (err) {
      setError(err.message);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket connection
  const { lastMessage, readyState } = useWebSocket(
    `ws://${window.location.host}/api/k8s/deployments/watch?namespace=${namespace}`,
    {
      onOpen: () => {
        console.log('Deployments WS connected');
        setConnectionStatus('connected');
      },
      onError: (err) => {
        console.error('Deployments WS error:', err);
        setConnectionStatus('error');
        fetchDeployments(); // Fallback to REST
      },
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  useEffect(() => {
    if (lastMessage?.data) {
      setDeployments(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  useEffect(() => {
    fetchDeployments();
  }, [namespace]);

  const scaleDeployment = async (name, replicas) => {
    try {
      const res = await fetch(`/api/k8s/deployments/${name}/scale`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ namespace, replicas })
      });
      if (!res.ok) throw new Error(await res.text());
      return true;
    } catch (err) {
      setError(`Scale failed: ${err.message}`);
      return false;
    }
  };

  const restartDeployment = async (name) => {
    try {
      const res = await fetch(`/api/k8s/deployments/${name}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
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
    connectionStatus,
    scaleDeployment,
    restartDeployment,
    refresh: fetchDeployments,
  };
}