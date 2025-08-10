// AnalyzerView/index.js

import React from 'react';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';

import HealthSummary from '../AnalyzerView/HealthSummary';
import PodActionView from '../AnalyzerView/PodActionView/PodActionView';
import OperationsCenter from '../AnalyzerView/OperationsCenter';

const AnalyzerView = () => {
  const location = useLocation();

  // Map pathnames to tab index for Tabs component controlled value
  const tabNameToIndex = {
    '/analyzer/health-summary': 0,
    '/analyzer/pod-actions': 1,
    '/analyzer/operations-center': 2,
  };

  // Default to first tab if no match
  const currentTab = tabNameToIndex[location.pathname] ?? 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={currentTab}>
        <Tab
          label="Health Summary"
          component={NavLink}
          to="/analyzer/health-summary"
        />
        <Tab
          label="Pod Actions"
          component={NavLink}
          to="/analyzer/pod-actions"
        />
        <Tab
          label="Operations Center"
          component={NavLink}
          to="/analyzer/operations-center"
        />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        <Routes>
          <Route path="health-summary" element={<HealthSummary />} />
          <Route path="pod-actions" element={<PodActionView />} />
          <Route path="operations-center" element={<OperationsCenter />} />
          {/* Optional redirect or fallback */}
          <Route path="*" element={<HealthSummary />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AnalyzerView;
