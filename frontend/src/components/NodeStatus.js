import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { Memory, DeveloperBoard, Cloud } from '@mui/icons-material';

const NodeStatus = ({ nodes }) => {
  return (
    <motion.div whileHover={{ scale: 1.01 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Node Status
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {nodes?.map((node, index) => (
            <Paper key={index} sx={{ p: 2, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: node.status === 'Ready' ? 'success.main' : 'error.main', mr: 1 }}>
                  {node.type === 'virtual' ? <Cloud /> : <DeveloperBoard />}
                </Avatar>
                <Typography variant="subtitle1">{node.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Memory color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  CPU: {node.cpuUsage}% | Memory: {node.memoryUsage}%
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

export default NodeStatus;
