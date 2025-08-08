import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, CircularProgress, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PodActionTable from './PodActionTable';

const PodActionsView = () => {
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [podsRes, deploymentsRes, helmRes] = await Promise.all([
        fetch('/api/podactions/pods').then(r => r.json()),
        fetch('/api/podactions/deployments').then(r => r.json()),
        fetch('/api/podactions/helm-releases').then(r => r.json())
      ]);
      setPods(podsRes || []);
      setDeployments(deploymentsRes || []);
      setHelmReleases(helmRes || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching pod actions data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Pod Actions</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated}
            </Typography>
          )}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Pods Table */}
      <Typography variant="h6" mb={1}>Pods</Typography>
      <PodActionTable type="pods" data={pods} refreshData={fetchData} />
      <Divider sx={{ my: 3 }} />

      {/* Deployments Table */}
      <Typography variant="h6" mb={1}>Deployments</Typography>
      <PodActionTable type="deployments" data={deployments} refreshData={fetchData} />
      <Divider sx={{ my: 3 }} />

      {/* Helm Releases Table */}
      <Typography variant="h6" mb={1}>Helm Releases</Typography>
      <PodActionTable type="helm" data={helmReleases} refreshData={fetchData} />
    </Box>
  );
};

export default PodActionsView;
