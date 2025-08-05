import React, { useState } from 'react';
import {
  Box, Typography, Select, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, LinearProgress,
  IconButton, Grid, useTheme, styled
} from '@mui/material';
import {
  Storage as NodeIcon,
  Folder as NamespaceIcon,
  Dns as PodIcon,
  ShowChart as MetricsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import useK8sData from '../hooks/useK8sData';

const MotionPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(5px)',
  borderRadius: '12px',
  color: 'white',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
}));

const Resources = () => {
  const theme = useTheme();
  const [resourceType, setResourceType] = useState('pods');
  const [namespace, setNamespace] = useState('default');
  const { data, loading, error, refresh } = useK8sData(resourceType, namespace);

  const resourceConfig = {
    nodes: { icon: <NodeIcon sx={{ color: '#4caf50' }} />, color: '#4caf50' },
    namespaces: { icon: <NamespaceIcon sx={{ color: '#2196f3' }} />, color: '#2196f3' },
    pods: { icon: <PodIcon sx={{ color: '#9c27b0' }} />, color: '#9c27b0' },
    metrics: { icon: <MetricsIcon sx={{ color: '#ff9800' }} />, color: '#ff9800' },
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'white', 
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          mb: 2
        }}>
          Kubernetes Resources
        </Typography>
      </motion.div>

      {/* Resource Selector */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MotionPaper>
            <Select
              fullWidth
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              sx={{ 
                color: 'white',
                '& .MuiSelect-icon': { color: 'white' },
                '&:before': { borderColor: 'rgba(255, 255, 255, 0.5)' },
              }}
            >
              {Object.entries(resourceConfig).map(([key, { icon }]) => (
                <MenuItem key={key} value={key} sx={{ color: '#333' }}>
                  <Box display="flex" alignItems="center">
                    {icon}
                    <Typography ml={1}>{key.charAt(0).toUpperCase() + key.slice(1)}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </MotionPaper>
        </Grid>
        <Grid item>
          <IconButton 
            onClick={refresh}
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Loading/Error States */}
      {loading && (
        <LinearProgress sx={{ 
          height: 2,
          borderRadius: 5,
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          mb: 3
        }} />
      )}
      {error && (
        <MotionPaper>
          <Typography color="error">{error}</Typography>
        </MotionPaper>
      )}

      {/* Resource Data Table */}
      {data && !loading && (
        <MotionPaper>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {Object.keys(data[0] || {}).map((key) => (
                    <TableCell key={key} sx={{ 
                      color: resourceConfig[resourceType]?.color || '#764ba2',
                      fontWeight: 'bold'
                    }}>
                      {key.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {Object.values(item).map((value, idx) => (
                      <TableCell key={idx} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MotionPaper>
      )}
    </Box>
  );
};

export default Resources;
