// src/pages/HomeView.js
import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';

const HomeView = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
      >
        Welcome to GrepMind Dashboard
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
        }}
      >
        <Typography variant="h6" sx={{ color: theme.palette.info.main, mb: 1 }}>
          Getting Started
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Use the sidebar to navigate through cluster resources, analyze health, view logs, and manage pod actions.
        </Typography>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: theme.palette.grey[100],
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          borderLeft: `6px solid ${theme.palette.success.main}`
        }}
      >
        <Typography variant="h6" sx={{ color: theme.palette.success.dark, mb: 1 }}>
          Cluster Health Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quickly identify pods in error, unhealthy deployments, and node statuses via the Analyzer tab.
        </Typography>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          borderLeft: `6px solid ${theme.palette.warning.main}`
        }}
      >
        <Typography variant="h6" sx={{ color: theme.palette.warning.dark, mb: 1 }}>
          Logs & Troubleshooting
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Access pod logs and troubleshoot issues using the Logs and Pod Actions tabs.
        </Typography>
      </Paper>
    </Box>
  );
};

export default HomeView;
