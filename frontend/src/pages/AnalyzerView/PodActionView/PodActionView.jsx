import React, { useState } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import PodTable from './components/PodTable';
import DeploymentTable from './components/DeploymentTable';
import HelmTable from './components/HelmTable';
import usePods from './hooks/usePods';
import useDeployments from './hooks/useDeployments';
import useHelm from './hooks/useHelm';

const PodActionView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [namespace, setNamespace] = useState('default');
  
  // Custom hooks for realtime data
  const { pods, error: podError, reload: reloadPods } = usePods(namespace);
  const { deployments, error: deployError } = useDeployments(namespace);
  const { releases, error: helmError } = useHelm(namespace);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Pods" />
        <Tab label="Deployments" />
        <Tab label="Helm Releases" />
      </Tabs>

      {podError && <Alert severity="error" sx={{ mb: 2 }}>{podError}</Alert>}
      
      {activeTab === 0 && (
        <PodTable 
          pods={pods} 
          namespace={namespace} 
          onNamespaceChange={setNamespace}
          onReload={reloadPods}
        />
      )}
      
      {activeTab === 1 && (
        <DeploymentTable 
          deployments={deployments} 
          namespace={namespace}
        />
      )}
      
      {activeTab === 2 && (
        <HelmTable 
          releases={releases} 
          namespace={namespace}
        />
      )}
    </Box>
  );
};

export default PodActionView;