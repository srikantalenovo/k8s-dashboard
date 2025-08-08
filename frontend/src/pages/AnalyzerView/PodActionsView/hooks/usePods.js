import { useState, useEffect } from 'react';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';

export default function usePods(namespace) {
  const [pods, setPods] = useState([]);
  const [error, setError] = useState(null);
  
  // REST fallback
  const fetchPods = async () => {
    try {
      const res = await fetch(`/api/k8s/pods?namespace=${namespace}`);
      const data = await res.json();
      setPods(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // WebSocket for realtime updates
  const { lastMessage } = useWebSocket(
    `ws://${window.location.host}/api/k8s/pods/watch?namespace=${namespace}`,
    {
      onError: () => fetchPods(), // Fallback if WS fails
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastMessage?.data) {
      setPods(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  useEffect(() => {
    fetchPods();
  }, [namespace]);

  return { pods, error, reload: fetchPods };
}