// AnalyzerView/index.js

import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import HealthSummary from '../AnalyzerView/HealthSummary';
import PodActionView from './PodActionsView/PodActionView';

const AnalyzerView = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Health Summary" />
        <Tab label="Pod Actions" />
      </Tabs>

      {tabIndex === 0 && <HealthSummary />}
      {tabIndex === 1 && <PodActionView />}
    </Box>
  );
};

export default AnalyzerView;
