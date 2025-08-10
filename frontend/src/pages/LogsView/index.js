// src/pages/LogsView/index.js

import React from 'react';
import { Box, Typography } from '@mui/material';

const LogsView = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Application Logs
      </Typography>
      <Typography>
        Logs content will appear here. (You can implement your logs UI later.)
      </Typography>
    </Box>
  );
};

export default LogsView;
