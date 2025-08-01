import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';

const ClusterHealth = ({ data }) => {
  return (
    <motion.div whileHover={{ scale: 1.01 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Cluster Health
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={data?.healthPercentage || 0} 
              color={data?.healthPercentage > 80 ? 'success' : data?.healthPercentage > 50 ? 'warning' : 'error'}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(data?.healthPercentage || 0)}%`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`Nodes: ${data?.nodes || 0}`} color="primary" />
          <Chip label={`Pods: ${data?.pods || 0}`} color="secondary" />
          <Chip label={`Healthy: ${data?.healthy || 0}`} color="success" />
        </Box>
      </Box>
    </motion.div>
  );
};

export default ClusterHealth;
