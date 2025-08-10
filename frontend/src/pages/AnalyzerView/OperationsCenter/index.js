import React, { useState, useEffect } from 'react';

function OperationsCenter() {
  const [namespace, setNamespace] = useState('default');
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [services, setServices] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorFilter, setErrorFilter] = useState(false);
  const [namespaces, setNamespaces] = useState([]);

  // Fetch namespaces for dropdown
  useEffect(() => {
    fetch('/api/k8s/namespaces')
      .then(res => res.json())
      .then(data => setNamespaces(data))
      .catch(console.error);
  }, []);

  // Fetch all resources whenever namespace or errorFilter changes
  useEffect(() => {
    setLoading(true);
    const nsQuery = namespace === '*' ? '' : `?namespace=${encodeURIComponent(namespace)}`;

    // Pods
    fetch(`/api/k8s/pods${nsQuery}`)
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (errorFilter) {
          filtered = data.filter(
            pod => pod.status === 'CrashLoopBackOff' || pod.status === 'Failed' || pod.status === 'Error'
          );
        }
        setPods(filtered);
      })
      .catch(console.error);

    // Deployments
    fetch(`/api/k8s/deployments${nsQuery}`)
      .then(res => res.json())
      .then(setDeployments)
      .catch(console.error);

    // Services
    fetch(`/api/k8s/services${nsQuery}`)
      .then(res => res.json())
      .then(setServices)
      .catch(console.error);

    // Helm Releases - only if namespace is not '*'
    if (namespace !== '*') {
      fetch(`/api/k8s/helm/releases?namespace=${encodeURIComponent(namespace)}`)
        .then(res => res.json())
        .then(setHelmReleases)
        .catch(console.error);
    } else {
      setHelmReleases([]);
    }

    setLoading(false);
  }, [namespace, errorFilter]);

  // Action handlers
  const restartPod = async (podName, ns) => {
    if (!window.confirm(`Restart pod ${podName} in namespace ${ns}?`)) return;
    try {
      const res = await fetch(`/api/k8s/pods/${encodeURIComponent(podName)}/restart?namespace=${encodeURIComponent(ns)}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) alert('Pod restart initiated');
      else alert(`Error: ${json.error || 'Unknown error'}`);
      // Refresh pods
      setPods(prev => prev.filter(p => p.name !== podName));
    } catch (err) {
      alert('Failed to restart pod: ' + err.message);
    }
  };

  const deletePod = async (podName, ns) => {
    if (!window.confirm(`Delete pod ${podName} in namespace ${ns}?`)) return;
    try {
      const res = await fetch(`/api/k8s/pods/${encodeURIComponent(podName)}?namespace=${encodeURIComponent(ns)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok) alert('Pod deleted');
      else alert(`Error: ${json.error || 'Unknown error'}`);
      // Refresh pods
      setPods(prev => prev.filter(p => p.name !== podName));
    } catch (err) {
      alert('Failed to delete pod: ' + err.message);
    }
  };

  // Render helpers
  const renderPodsTable = () => (
    <table className="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Namespace</th>
          <th>Node</th>
          <th>Restarts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pods.map(pod => (
          <tr key={pod.name}>
            <td>{pod.name}</td>
            <td>{pod.status}</td>
            <td>{pod.namespace}</td>
            <td>{pod.nodeName}</td>
            <td>{pod.restarts}</td>
            <td>
              <button onClick={() => restartPod(pod.name, pod.namespace)}>Restart</button>{' '}
              <button onClick={() => deletePod(pod.name, pod.namespace)}>Delete</button>
            </td>
          </tr>
        ))}
        {pods.length === 0 && (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center' }}>No pods found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderDeploymentsTable = () => (
    <table className="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Namespace</th>
          <th>Replicas</th>
          <th>Ready</th>
          <th>Available</th>
          <th>Strategy</th>
        </tr>
      </thead>
      <tbody>
        {deployments.map(dep => (
          <tr key={dep.name}>
            <td>{dep.name}</td>
            <td>{dep.namespace}</td>
            <td>{dep.replicas}</td>
            <td>{dep.readyReplicas}</td>
            <td>{dep.availableReplicas}</td>
            <td>{dep.strategy}</td>
          </tr>
        ))}
        {deployments.length === 0 && (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center' }}>No deployments found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderServicesTable = () => (
    <table className="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Namespace</th>
          <th>Type</th>
          <th>Cluster IP</th>
          <th>Ports</th>
        </tr>
      </thead>
      <tbody>
        {services.map(svc => (
          <tr key={svc.name}>
            <td>{svc.name}</td>
            <td>{svc.namespace}</td>
            <td>{svc.type}</td>
            <td>{svc.clusterIP}</td>
            <td>{svc.ports.map(p => `${p.port}/${p.protocol}`).join(', ')}</td>
          </tr>
        ))}
        {services.length === 0 && (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center' }}>No services found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderHelmReleasesTable = () => (
    <table className="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Namespace</th>
          <th>Revision</th>
          <th>Status</th>
          <th>Chart</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {helmReleases.map(rel => (
          <tr key={rel.name}>
            <td>{rel.name}</td>
            <td>{rel.namespace}</td>
            <td>{rel.revision}</td>
            <td>{rel.status}</td>
            <td>{rel.chart}</td>
            <td>
              {/* Placeholder for helm actions */}
              <button disabled>Upgrade</button>{' '}
              <button disabled>Rollback</button>{' '}
              <button disabled>Uninstall</button>
            </td>
          </tr>
        ))}
        {helmReleases.length === 0 && (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center' }}>No helm releases found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="operations-center-container">
      <h2>Operations Center</h2>

      <label>
        Namespace:{' '}
        <select value={namespace} onChange={e => setNamespace(e.target.value)}>
          <option value="*">All Namespaces (*)</option>
          {namespaces.map(ns => (
            <option key={ns.name} value={ns.name}>
              {ns.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ marginLeft: '20px' }}>
        <input
          type="checkbox"
          checked={errorFilter}
          onChange={e => setErrorFilter(e.target.checked)}
        />{' '}
        Show error pods only
      </label>

      {loading && <p>Loading...</p>}

      <h3>Pods</h3>
      {renderPodsTable()}

      <h3>Deployments</h3>
      {renderDeploymentsTable()}

      <h3>Services</h3>
      {renderServicesTable()}

      <h3>Helm Releases</h3>
      {renderHelmReleasesTable()}
    </div>
  );
}

export default OperationsCenter;
