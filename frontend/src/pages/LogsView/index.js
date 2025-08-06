import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const LogsView = () => {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Logs Viewer (Coming Soon)
      </Typography>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="body1">
          This section will allow you to view and search logs from your Kubernetes resources like Pods, Jobs, and Deployments.
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Features like real-time tailing, filtering by label, namespace selection, and time-range will be added here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LogsView;
