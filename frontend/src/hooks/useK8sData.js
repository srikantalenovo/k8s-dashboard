import { useState, useEffect } from 'react';
import api from '../services/api';

export default function useK8sData(resourceType, namespace = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (resourceType) {
        case 'nodes':
          endpoint = '/api/k8s/nodes';
          break;
        case 'namespaces':
          endpoint = '/api/k8s/namespaces';
          break;
        case 'pods':
          endpoint = namespace 
            ? `/api/k8s/pods/${namespace}`
            : '/api/k8s/pods';
          break;
        case 'metrics':
          // Requires specific pod selection
          return;
        default:
          endpoint = `/api/k8s/${resourceType}`;
      }

      const response = await api.get(endpoint);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resourceType, namespace]);

  return { data, loading, error, refresh: fetchData };
}
