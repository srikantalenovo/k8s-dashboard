
import React, { useState, useEffect } from 'react';

import {
  Box, Typography, Select, MenuItem, Table, TableBody, Tooltip, FormControl, InputLabel, Alert,
  TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Paper, Grid,
  Avatar, LinearProgress, styled, Container, useTheme, Popover,
  Dialog, DialogTitle, DialogContent, DialogActions, List,
  ListItem, ListItemText, ListItemIcon, Checkbox, FormControlLabel
} from '@mui/material';
import {
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Folder as ResourcesIcon,
  List as LogsIcon,
  ExitToApp as SignOutIcon,
  Dashboard as DashboardIcon,
  Storage as ClusterIcon,
  Dns as NodeIcon,
  ShowChart as MetricsIcon,
  Storage as StorageIcon,
  Folder as NamespaceIcon,
  Dns as PodIcon,
  Apps as AppsIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
// Permission presets
const PERMISSION_OPTIONS = [
  { resource: 'pods', actions: ['read', 'delete'] },
  { resource: 'nodes', actions: ['read'] },
  { resource: 'deployments', actions: ['read', 'update'] },
  { resource: 'logs', actions: ['read'] },
  { resource: 'cluster', actions: ['read'] },
  { resource: '*', actions: ['*'] }
];

const ROLE_PRESETS = {
  admin: [{ resource: '*', actions: ['*'] }],
  editor: [
    { resource: 'pods', actions: ['read', 'delete'] },
    { resource: 'deployments', actions: ['read', 'update'] },
    { resource: 'nodes', actions: ['read'] },
    { resource: 'logs', actions: ['read'] }
  ],
  viewer: [
    { resource: 'pods', actions: ['read'] },
    { resource: 'deployments', actions: ['read'] },
    { resource: 'nodes', actions: ['read'] },
    { resource: 'logs', actions: ['read'] }
  ]
};

const hasPermission = (user, resource, action) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.some(
    perm =>
      (perm.resource === resource || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
  );
};

const GradientBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  }
}));

const MotionPaper = ({ children }) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(5px)',
      borderRadius: '12px',
      color: 'white',
      height: '100%',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {children}
    </Paper>
  </motion.div>
);

const ResourcesView = ({ currentUser }) => {
  const [resourceType, setResourceType] = useState('nodes');
  const [namespace, setNamespace] = useState('default');
  const [namespaces, setNamespaces] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Updated resource config with proper API mappings
  const resourceConfig = {
    nodes: { 
      label: 'Nodes', 
      namespaced: false,
      apiPath: 'nodes' 
    },
    namespaces: { 
      label: 'Namespaces', 
      namespaced: false,
      apiPath: 'namespaces' 
    },
    pods: { 
      label: 'Pods', 
      namespaced: true,
      apiPath: 'pods' 
    },
    deployments: { 
      label: 'Deployments', 
      namespaced: true,
      apiPath: 'deployments' 
    },
    statefulsets: { 
      label: 'StatefulSets', 
      namespaced: true,
      apiPath: 'statefulsets' 
    },
    daemonsets: { 
      label: 'DaemonSets', 
      namespaced: true,
      apiPath: 'daemonsets' 
    },
    services: { 
      label: 'Services', 
      namespaced: true,
      apiPath: 'services' 
    },
    configmaps: { 
      label: 'ConfigMaps', 
      namespaced: true,
      apiPath: 'configmaps' 
    },
    secrets: { 
      label: 'Secrets', 
      namespaced: true,
      apiPath: 'secrets' 
    },
    ingresses: { 
      label: 'Ingresses', 
      namespaced: true,
      apiPath: 'ingresses' 
    }    
  };

  const fetchNamespaces = async () => {
    try {
      const res = await api.get('/api/k8s/namespaces');
      setNamespaces((res.data || []).map(ns => ns.name || ns));
    } catch (err) {
      console.error('Error fetching namespaces:', err);
    }
  };

  // Fixed fetchData function
  // Updated fetchData function
  const fetchData = async () => {
    if (!hasPermission(currentUser, resourceType, 'read')) {
      setError('You do not have permission to view this resource');
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const config = resourceConfig[resourceType];
      let url = `/api/k8s/${config.apiPath}`;
      
      // For namespaced resources, include namespace in the request
      if (config.namespaced) {
        // For GET requests with query params
        const params = new URLSearchParams();
        params.append('namespace', namespace);
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      const formatted = Array.isArray(res.data) ? res.data : [res.data];
      setData(formatted);
      
    } catch (err) {
      console.error(`Error fetching ${resourceType}:`, err);
      setError(err.response?.data?.message || `Failed to fetch ${resourceType}`);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchNamespaces();
  }, []);

  useEffect(() => {
    fetchData();
  }, [resourceType, namespace, currentUser]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* Resource Selector */}
        <Grid item xs={12} md={4}>
          <MotionPaper>
            <Select
              fullWidth
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
            >
              {Object.entries(resourceConfig)
                .filter(([key]) => hasPermission(currentUser, key, 'read'))
                .map(([key, { label }]) => (
                  <MenuItem key={key} value={key} sx={{ color: '#333' }}>
                    {label}
                  </MenuItem>
                ))}
            </Select>
          </MotionPaper>
        </Grid>

        {/* Namespace Selector (only for namespaced resources) */}
        {resourceConfig[resourceType]?.namespaced && (
          <Grid item xs={12} md={4}>
            <MotionPaper>
              <Select
                fullWidth
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
              >
                {namespaces.map((ns) => (
                  <MenuItem key={ns} value={ns}>{ns}</MenuItem>
                ))}
              </Select>
            </MotionPaper>
          </Grid>
        )}

        {/* Refresh Button */}
        <Grid item>
          <IconButton
            onClick={fetchData}
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

      {/* Loading / Error */}
      {loading && <LinearProgress sx={{ height: 2, borderRadius: 5, mb: 2 }} />}
      {error && (
        <MotionPaper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </MotionPaper>
      )}

      {/* Data Table */}
      <MotionPaper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                {data[0] &&
                  Object.keys(data[0]).map((key) => (
                    <TableCell key={key} sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {key.toUpperCase()}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' } }}>
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
    </Box>
  );
};  

export default ResourcesView;
