import api from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Paper, Grid,
  Avatar, LinearProgress, styled, Container, useTheme, Popover,
  Dialog, DialogTitle, DialogContent, DialogActions, List,
  ListItem, ListItemText, ListItemIcon
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
import useK8sData from '../hooks/useK8sData';

// ✅ RBAC helper for plain JSON user objects
const hasPermission = (user, resource, action) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.some(
    perm =>
      (perm.resource === resource || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
  );
};

// Gradient background styling
const GradientBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(3),
}));

// Animated Paper component
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

// Header component with RBAC controls
const Header = ({ currentView, setCurrentView, handleLogout, currentUser }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState('viewer');

  const navItems = [
    { name: 'Home', icon: <HomeIcon />, permission: null },
    { name: 'Analyzer', icon: <AnalyticsIcon />, permission: ['analyzer', 'read'] },
    { name: 'Resources', icon: <ResourcesIcon />, permission: ['nodes', 'read'] },
    { name: 'Logs', icon: <LogsIcon />, permission: ['logs', 'read'] }
  ].filter(item => !item.permission || hasPermission(currentUser, ...item.permission));

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserIconClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchUsers();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
    setRoleDialogOpen(false);
  };

  const handleRoleUpdate = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, {
        role: currentRole
      });
      fetchUsers();
      handleClose();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setCurrentRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing(2),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      marginBottom: theme.spacing(3),
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{
          fontSize: 40,
          color: 'white',
          marginRight: theme.spacing(1)
        }} />
        <Typography variant="h5" sx={{
          color: 'white',
          fontWeight: 'bold',
          fontFamily: '"Poppins", sans-serif'
        }}>
          GrepMind
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: theme.spacing(1) }}>
        {navItems.map((item) => (
          <Button
            key={item.name}
            startIcon={item.icon}
            onClick={() => setCurrentView(item.name)}
            sx={{
              color: currentView === item.name ? 'white' : 'rgba(255, 255, 255, 0.7)',
              backgroundColor: currentView === item.name ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white'
              },
              borderRadius: '8px',
              textTransform: 'none',
              padding: theme.spacing(1, 2),
              transition: 'all 0.3s ease'
            }}
          >
            {item.name}
          </Button>
        ))}
      </Box>

      {/* User Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {currentUser?.role === 'admin' && (
          <>
            <IconButton
              onClick={handleUserIconClick}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <PeopleIcon />
            </IconButton>

            {/* ... Admin popover & role dialog remain unchanged ... */}
          </>
        )}

        {/* User badge */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '4px 12px',
          marginRight: '8px'
        }}>
          <Typography variant="body2" sx={{
            color: 'white',
            marginRight: '8px',
            textTransform: 'capitalize'
          }}>
            {currentUser?.role}
          </Typography>
          <Avatar sx={{
            width: 32,
            height: 32,
            backgroundColor: currentUser?.role === 'admin' ? '#ff5722' :
              currentUser?.role === 'editor' ? '#4caf50' : '#2196f3'
          }}>
            {currentUser?.username?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        {/* Sign Out */}
        <IconButton
          onClick={handleLogout}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          }}
        >
          <SignOutIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

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

const AnalyzerView = () => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
      Cluster Analyzer
    </Typography>
  </Box>
);

const ResourcesView = ({ currentUser }) => {
  const [resourceType, setResourceType] = useState('nodes');
  const [namespace, setNamespace] = useState('default');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!hasPermission(currentUser, resourceType, 'read')) {
      setError('You do not have permission to view this resource');
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/api/k8s/${resourceType}${resourceType === 'pods' ? `?namespace=${namespace}` : ''}`
      );
      if (!response.data) throw new Error('No data received');
      const formattedData = Array.isArray(response.data) ? response.data : [response.data];
      setData(formattedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resourceType, namespace, currentUser]);

  const resourceConfig = {
    nodes: { icon: <NodeIcon sx={{ color: '#4caf50' }} />, label: 'Nodes' },
    namespaces: { icon: <NamespaceIcon sx={{ color: '#2196f3' }} />, label: 'Namespaces' },
    pods: { icon: <PodIcon sx={{ color: '#9c27b0' }} />, label: 'Pods' },
    deployments: { icon: <AppsIcon sx={{ color: '#ff9800' }} />, label: 'Deployments' }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MotionPaper>
            <Select
              fullWidth
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              sx={{
                color: 'white',
                '& .MuiSelect-icon': { color: 'white' }
              }}
            >
              {Object.entries(resourceConfig)
                .filter(([key]) => hasPermission(currentUser, key, 'read'))
                .map(([key, { icon, label }]) => (
                  <MenuItem key={key} value={key} sx={{ color: '#333' }}>
                    <Box display="flex" alignItems="center">
                      {icon}
                      <Typography ml={1}>{label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </MotionPaper>
        </Grid>

        {['pods', 'deployments'].includes(resourceType) && (
          <Grid item xs={12} md={4}>
            <MotionPaper>
              <Select
                fullWidth
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiSelect-icon': { color: 'white' }
                }}
              >
                <MenuItem value="default">default</MenuItem>
                <MenuItem value="kube-system">kube-system</MenuItem>
                {hasPermission(currentUser, 'namespaces', 'read') && (
                  <MenuItem value="all">All Namespaces</MenuItem>
                )}
              </Select>
            </MotionPaper>
          </Grid>
        )}

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

      {loading && <LinearProgress sx={{ height: 2, mb: 3 }} />}
      {error && <Typography color="error">{error}</Typography>}

      <MotionPaper>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {data[0] && Object.keys(data[0]).map((key) => (
                  <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                    {key.toUpperCase()}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {Object.values(item).map((value, idx) => (
                    <TableCell key={idx}>
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

const LogsView = () => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
      Application Logs
    </Typography>
  </Box>
);

const Dashboard = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('Home');
  const [clusterHealth] = useState(85);
  const [cpuUsage] = useState(65);
  const [memoryUsage] = useState(72);
  const [storageUsage] = useState(45);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderView = () => {
    switch (currentView) {
      case 'Home': return <HomeView />;
      case 'Analyzer': return hasPermission(currentUser, 'analyzer', 'read') ? <AnalyzerView /> : <HomeView />;
      case 'Resources': return hasPermission(currentUser, 'nodes', 'read') ? <ResourcesView currentUser={currentUser} /> : <HomeView />;
      case 'Logs': return hasPermission(currentUser, 'logs', 'read') ? <LogsView /> : <HomeView />;
      default: return <HomeView />;
    }
  };

  return (
    <GradientBox>
      <Container maxWidth="xl">
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          currentUser={currentUser}
        />
        {renderView()}
        {currentView === 'Home' && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {hasPermission(currentUser, 'cluster', 'read') && (
              <Grid item xs={12} md={6} lg={3}>
                <MotionPaper>
                  <Typography variant="h6">Cluster Health</Typography>
                </MotionPaper>
              </Grid>
            )}
            {hasPermission(currentUser, 'metrics', 'read') && (
              <Grid item xs={12} md={6} lg={3}>
                <MotionPaper>
                  <Typography variant="h6">CPU Usage</Typography>
                </MotionPaper>
              </Grid>
            )}
            {hasPermission(currentUser, 'metrics', 'read') && (
              <Grid item xs={12} md={6} lg={3}>
                <MotionPaper>
                  <Typography variant="h6">Memory Usage</Typography>
                </MotionPaper>
              </Grid>
            )}
            {hasPermission(currentUser, 'storage', 'read') && (
              <Grid item xs={12} md={6} lg={3}>
                <MotionPaper>
                  <Typography variant="h6">Storage Usage</Typography>
                </MotionPaper>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </GradientBox>
  );
};

export default Dashboard;
