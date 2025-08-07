import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import HealthSummary from '../HealthSummary';
import PodActions from '../PodActions'; // ✅ Import PodActions

const AnalyzerView = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="Analyzer Tabs"
        sx={{ mb: 3 }}
      >
        <Tab label="Health Summary" />
        <Tab label="Pod Actions" /> {/* ✅ New Tab */}
      </Tabs>

      {selectedTab === 0 && (
        <Box>
          <HealthSummary />
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <PodActions /> {/* ✅ Render Pod Actions */}
        </Box>
      )}
    </Box>
  );
};

export default AnalyzerView;
