import api from '../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const ResourcesView = ({ selectedNamespace }) => {
  const [resources, setResources] = useState([]);
  const [resourceType, setResourceType] = useState('pods');
  const [error, setError] = useState(null);

  const resourceEndpoints = {
    pods: '/api/k8s/pods',
    deployments: '/api/k8s/deployments',
    services: '/api/k8s/services',
    replicasets: '/api/k8s/replicasets',
    statefulsets: '/api/k8s/statefulsets',
    daemonsets: '/api/k8s/daemonsets',
    jobs: '/api/k8s/jobs',
    cronjobs: '/api/k8s/cronjobs',
    configmaps: '/api/k8s/configmaps',
    secrets: '/api/k8s/secrets',
    ingresses: '/api/k8s/ingresses',
    persistentvolumeclaims: '/api/k8s/persistentvolumeclaims'
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value || '-';
  };

  const fetchResources = async () => {
    try {
      const url = `${resourceEndpoints[resourceType]}?namespace=${selectedNamespace}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${resourceType}`);
      }
      const data = await res.json();
      setResources(data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setResources([]);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (selectedNamespace) {
      fetchResources();
    }
  }, [resourceType, selectedNamespace]);

  const renderTable = () => {
    if (resources.length === 0) return <Typography>No data found.</Typography>;

    const headers = Object.keys(resources[0]);

    return (
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index}><strong>{header}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <pre style={{ margin: 0 }}>{formatValue(item[header])}</pre>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ marginTop: 3 }}>
      <Typography variant="h6">Kubernetes Resources</Typography>
      <FormControl sx={{ minWidth: 200, marginTop: 2 }}>
        <InputLabel>Resource Type</InputLabel>
        <Select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          label="Resource Type"
        >
          {Object.keys(resourceEndpoints).map((type) => (
            <MenuItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error ? (
        <Alert severity="error" sx={{ marginTop: 2 }}>{error}</Alert>
      ) : (
        renderTable()
      )}
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
