// src/pages/HomeView.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const HomeView = () => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
      Welcome to GrepMind Dashboard
    </Typography>
    <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
      Your centralized monitoring and analytics platform
    </Typography>
  </Box>
);

export default HomeView;
