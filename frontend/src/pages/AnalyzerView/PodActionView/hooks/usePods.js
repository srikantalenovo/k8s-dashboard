import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket';

export default function usePods(namespace = 'default') {
  const [pods, setPods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // REST fallback
  const fetchPods = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/k8s/pods?namespace=${namespace}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPods(data);
    } catch (err) {
      setError(err.message);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket connection
  const { lastJsonMessage, readyState } = useWebSocket(
    `ws://${window.location.host}/api/k8s/pods/watch?namespace=${namespace}`,
    {
      shouldReconnect: () => true,
      reconnectInterval: 3000,
      reconnectAttempts: 10,
      onOpen: () => setConnectionStatus('connected'),
      onError: (err) => {
        console.error('Pods WS error:', err);
        setConnectionStatus('error');
        fetchPods(); // Fallback to REST
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

  // Update pods when WebSocket message arrives
  useEffect(() => {
    if (lastJsonMessage) {
      setPods(lastJsonMessage);
      setConnectionStatus('connected');
    }
  }, [lastJsonMessage]);

  // Initial fetch and namespace change handler
  useEffect(() => {
    fetchPods();
  }, [namespace]);

  // Pod actions
  const deletePod = async (podName) => {
    try {
      const res = await fetch(`/api/k8s/pods/${podName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
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
      const res = await fetch(`/api/k8s/pods/${podName}/restart?namespace=${namespace}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
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
    pods,
    isLoading,
    error,
    connectionStatus,
    readyState,
    deletePod,
    restartPod,
    refresh: fetchPods,
    // Additional status helpers
    isConnected: connectionStatus === 'connected',
    isError: connectionStatus === 'error'
  };
}