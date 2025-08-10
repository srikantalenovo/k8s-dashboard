// src/components/Header.js
import React, { useState } from 'react';
import {
  Box, Typography, Select, MenuItem, List, ListItem, ListItemText,
  IconButton, Popover, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, Button
} from '@mui/material';
import {
  People as PeopleIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PERMISSION_OPTIONS, ROLE_PRESETS } from '../config/permissions';

const Header = ({ currentView, setCurrentView, handleLogout, currentUser }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState('viewer');

  // Fetch users from admin API
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
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
      await fetch(`/api/admin/users/${selectedUser.id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentRole,
          permissions: selectedUser.permissions || [],
        }),
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
      permissions: ROLE_PRESETS[role] || [],
    }));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        padding: 2,
        backgroundColor: 'rgba(35, 18, 18, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        marginBottom: 3,
        gap: 2,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          GrepMind
        </Typography>
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* You can add navigation buttons here if needed */}
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
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <PeopleIcon />
            </IconButton>

            {/* User Management Popover */}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ p: 2, width: 300 }}>
                <Typography variant="h6" gutterBottom>
                  User Management
                </Typography>
                <List>
                  {users.map((user) => (
                    <ListItem
                      key={user.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => openRoleDialog(user)}>
                          <EditIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={user.username}
                        secondary={`${user.role} - ${user.email}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Popover>

            {/* Role Dialog */}
            <Dialog open={roleDialogOpen} onClose={handleClose}>
              <DialogTitle>Update User Role & Permissions</DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1" gutterBottom>
                  Editing: {selectedUser?.username}
                </Typography>
                <select
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Box sx={{ mt: 3 }}>
                  {PERMISSION_OPTIONS.map((perm) => (
                    <Box key={perm.resource} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {perm.resource}
                      </Typography>
                      {perm.actions.map((action) => {
                        const checked = selectedUser?.permissions?.some(
                          (p) => p.resource === perm.resource && p.actions.includes(action)
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
                                    const existing = newPermissions.find((p) => p.resource === perm.resource);
                                    if (existing) {
                                      if (!existing.actions.includes(action)) {
                                        existing.actions.push(action);
                                      }
                                    } else {
                                      newPermissions.push({ resource: perm.resource, actions: [action] });
                                    }
                                  } else {
                                    newPermissions = newPermissions
                                      .map((p) =>
                                        p.resource === perm.resource
                                          ? { ...p, actions: p.actions.filter((a) => a !== action) }
                                          : p
                                      )
                                      .filter((p) => p.actions.length > 0);
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
                <Button variant="contained" onClick={handleRoleUpdate}>
                  Update
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        {/* Current User Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '4px 12px',
            cursor: 'default',
            color: 'white',
          }}
        >
          <Typography variant="body2" sx={{ mr: 1, textTransform: 'capitalize' }}>
            {currentUser?.role}
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor:
                currentUser?.role === 'admin'
                  ? '#ff5722'
                  : currentUser?.role === 'editor'
                  ? '#4caf50'
                  : '#2196f3',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: 18,
              userSelect: 'none',
            }}
          >
            {currentUser?.username?.charAt(0).toUpperCase()}
          </Box>
        </Box>

        {/* Logout Button */}
        <IconButton
          onClick={handleLogout}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
          }}
        >
          {/* You can use any logout icon here */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            fill="white"
          >
            <path d="M10.09 15.59L8.67 14.17 11.75 11.09 8.67 8.01 10.09 6.59 14.5 11 10.09 15.41z" />
            <path d="M20 19V5h-8v2h6v10h-6v2h8z" />
          </svg>
        </IconButton>
      </Box>
    </Box>
  );
};

export default Header;
