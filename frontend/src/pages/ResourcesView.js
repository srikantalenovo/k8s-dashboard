import React, { useEffect, useState } from 'react';

const ResourcesView = ({ selectedResource, selectedNamespace }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiMap = {
    pods: '/api/k8s/pods',
    services: '/api/k8s/services',
    deployments: '/api/k8s/deployments',
    jobs: '/api/k8s/jobs',
    ingresses: '/api/k8s/ingresses',
    statefulsets: '/api/k8s/statefulsets',
    daemonsets: '/api/k8s/daemonsets',
    cronjobs: '/api/k8s/cronjobs',
    replicasets: '/api/k8s/replicasets',
    configmaps: '/api/k8s/configmaps',
    secrets: '/api/k8s/secrets',
    persistentvolumes: '/api/k8s/persistentvolumes',
    persistentvolumeclaims: '/api/k8s/persistentvolumeclaims',
    networkpolicies: '/api/k8s/networkpolicies',
    nodes: '/api/k8s/nodes',
  };

  useEffect(() => {
    if (!selectedResource) return;
    setLoading(true);

    let url = apiMap[selectedResource];
    if (!url) {
      setData([]);
      setLoading(false);
      return;
    }

    // Append namespace if required
    const namespacedResources = [
      'pods', 'services', 'deployments', 'jobs', 'cronjobs',
      'ingresses', 'configmaps', 'secrets', 'persistentvolumeclaims',
      'statefulsets', 'daemonsets', 'replicasets', 'networkpolicies',
    ];

    if (namespacedResources.includes(selectedResource)) {
      url += `?namespace=${selectedNamespace}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data.items || data); // Support both array and items object
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching:', err);
        setData([]);
        setLoading(false);
      });
  }, [selectedResource, selectedNamespace]);

  const renderTable = () => {
    if (!data.length) return <p>No {selectedResource} found.</p>;

    // Try to detect some common metadata to render dynamic table
    const sample = data[0];
    const headers = Object.keys(sample.metadata || {});

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} style={{ border: '1px solid #ddd', padding: '8px', textTransform: 'capitalize' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((res, idx) => (
            <tr key={idx}>
              {headers.map((header, i) => (
                <td key={i} style={{ border: '1px solid #eee', padding: '6px' }}>
                  {res.metadata?.[header] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '12px', boxShadow: '0 1px 5px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
        {selectedResource} in <code>{selectedNamespace}</code> namespace
      </h3>
      {loading ? <p>Loading {selectedResource}...</p> : renderTable()}
    </div>
  );
};

export default ResourcesView;
