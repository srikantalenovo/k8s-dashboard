import api from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Select, MenuItem, Table, TableBody, Tooltip,
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

const Header = ({ currentView, setCurrentView, handleLogout, currentUser }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState('viewer');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
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
      await api.put(`/api/admin/users/${selectedUser.id}/access`, {
        role: currentRole,
        permissions: selectedUser.permissions || []
      });
      fetchUsers();
      handleClose();
    } catch (error) {
      console.error('Error updating access:', error);
    }
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setCurrentRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setSelectedUser((prev) => ({
      ...prev,
      permissions: ROLE_PRESETS[role] || []
    }));
  };

  const navItems = [
    { name: 'Home', icon: <HomeIcon />, permission: null },
    { name: 'Analyzer', icon: <AnalyticsIcon />, permission: ['analyzer', 'read'] },
    { name: 'Resources', icon: <ResourcesIcon />, permission: ['nodes', 'read'] },
    { name: 'Logs', icon: <LogsIcon />, permission: ['logs', 'read'] }
  ].filter(item => !item.permission || hasPermission(currentUser, ...item.permission));

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      padding: theme.spacing(2),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      marginBottom: theme.spacing(3),
      gap: 2
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ fontSize: 36, color: 'white', mr: 1 }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          GrepMind
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) }}>
        {navItems.map((item) => (
          <Button
            key={item.name}
            startIcon={item.icon}
            onClick={() => setCurrentView(item.name)}
            sx={{
              color: currentView === item.name ? 'white' : 'rgba(255, 255, 255, 0.7)',
              backgroundColor: currentView === item.name ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white' },
              borderRadius: '8px',
              textTransform: 'none',
              padding: theme.spacing(1, 2)
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
            <IconButton onClick={handleUserIconClick} sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}>
              <PeopleIcon />
            </IconButton>
            {/* Popover */}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ p: 2, width: 300 }}>
                <Typography variant="h6" gutterBottom>User Management</Typography>
                <List>
                  {users.map((user) => (
                    <ListItem key={user.id} secondaryAction={
                      <IconButton edge="end" onClick={() => openRoleDialog(user)}>
                        <EditIcon />
                      </IconButton>
                    }>
                      <ListItemIcon>
                        {user.role === 'admin' ? <AdminPanelSettingsIcon /> :
                          user.role === 'editor' ? <EditIcon /> : <VisibilityIcon />}
                      </ListItemIcon>
                      <ListItemText primary={user.username} secondary={`${user.role} - ${user.email}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Popover>
            {/* Dialog */}
            <Dialog open={roleDialogOpen} onClose={handleClose}>
              <DialogTitle>Update User Role & Permissions</DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1" gutterBottom>Editing: {selectedUser?.username}</Typography>
                <Select
                  fullWidth
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
                <Box sx={{ mt: 3 }}>
                  {PERMISSION_OPTIONS.map((perm) => (
                    <Box key={perm.resource} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{perm.resource}</Typography>
                      {perm.actions.map((action) => {
                        const checked = selectedUser?.permissions?.some(
                          p => p.resource === perm.resource && p.actions.includes(action)
                        );
                        return (
                          <FormControlLabel
                            key={`${perm.resource}-${action}`}
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(e) => {
                                  let newPermissions = [...(selectedUser?.permissions || [])];
                                  if (e.target.checked) {
                                    const existing = newPermissions.find(p => p.resource === perm.resource);
                                    if (existing) {
                                      if (!existing.actions.includes(action)) {
                                        existing.actions.push(action);
                                      }
                                    } else {
                                      newPermissions.push({ resource: perm.resource, actions: [action] });
                                    }
                                  } else {
                                    newPermissions = newPermissions.map(p =>
                                      p.resource === perm.resource
                                        ? { ...p, actions: p.actions.filter(a => a !== action) }
                                        : p
                                    ).filter(p => p.actions.length > 0);
                                  }
                                  setSelectedUser({ ...selectedUser, permissions: newPermissions });
                                }}
                              />
                            }
                            label={action}
                          />
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleRoleUpdate}>Update</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
        {/* Tooltip */}
        <Tooltip title={currentUser?.username || ''} arrow>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '4px 12px',
            cursor: 'pointer'
          }}>
            <Typography variant="body2" sx={{ color: 'white', mr: 1, textTransform: 'capitalize' }}>
              {currentUser?.role}
            </Typography>
            <Avatar sx={{
              width: 32, height: 32,
              backgroundColor: currentUser?.role === 'admin' ? '#ff5722' :
                currentUser?.role === 'editor' ? '#4caf50' : '#2196f3'
            }}>
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Tooltip>
        <IconButton onClick={handleLogout} sx={{
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
        }}>
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
// ResourcesView Starting

// 📍 Replace your existing ResourcesView in Dashboard.js with this:
const ResourcesView = ({ currentUser }) => {
  const [resourceType, setResourceType] = useState('nodes');
  const [namespace, setNamespace] = useState('default');
  const [namespaces, setNamespaces] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch namespaces automatically
  const fetchNamespaces = async () => {
    try {
      const res = await api.get('/api/k8s/namespaces');
      setNamespaces(res.data);
    } catch (err) {
      console.error('❌ Error fetching namespaces:', err);
      setNamespaces(['default']); // fallback
    }
  };

  // Fetch resource data
  const fetchData = async () => {
    if (!hasPermission(currentUser, resourceType, 'read')) {
      setError('You do not have permission to view this resource');
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let url = `/api/k8s/${resourceType}`;
      if (['pods', 'deployments'].includes(resourceType)) {
        url += `?namespace=${namespace}`;
      }
      const response = await api.get(url);
      setData(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
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

  const resourceConfig = {
    nodes: { icon: <NodeIcon sx={{ color: '#4caf50' }} />, label: 'Nodes' },
    namespaces: { icon: <NamespaceIcon sx={{ color: '#2196f3' }} />, label: 'Namespaces' },
    pods: { icon: <PodIcon sx={{ color: '#9c27b0' }} />, label: 'Pods' },
    deployments: { icon: <AppsIcon sx={{ color: '#ff9800' }} />, label: 'Deployments' }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* Resource Type Selector */}
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

        {/* Namespace Selector */}
        {['pods', 'deployments'].includes(resourceType) && (
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
          <IconButton onClick={fetchData} sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          }}>
            <RefreshIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ height: 2, borderRadius: 5, mb: 2 }} />}

      {/* Error Message */}
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
                {data[0] && Object.keys(data[0]).map((key) => (
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


// ResourcesView ending
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
      </Container>
    </GradientBox>
  );
};

export default Dashboard;
