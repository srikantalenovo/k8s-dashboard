// src/components/Sidebar.js
import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box,
  Typography, Divider, Avatar, Tooltip, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Folder as ResourcesIcon,
  List as LogsIcon,
  Dns as PodIcon
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { hasPermission } from '../utils/permissions';

const drawerWidth = 240;

const navItems = [
  { label: 'Home', icon: <HomeIcon />, key: 'home', path: '/dashboard/home', permission: null },
  { label: 'Analyzer', icon: <AnalyticsIcon />, key: 'analyzer', path: '/dashboard/analyzer', permission: ['analyzer', 'read'] },
  { label: 'Resources', icon: <ResourcesIcon />, key: 'resources', path: '/dashboard/resources', permission: ['nodes', 'read'] },
  { label: 'Logs', icon: <LogsIcon />, key: 'logs', path: '/dashboard/logs', permission: ['logs', 'read'] },
];

const Sidebar = ({ currentUser }) => {
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 72 : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? 72 : drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e2f',
          color: '#ffffff',
          transition: 'width 0.3s',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo and Collapse Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: 2,
            py: 2,
          }}
        >
          {!collapsed && (
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              GrepMind
            </Typography>
          )}
          <IconButton onClick={toggleCollapse} sx={{ color: '#ffffff' }}>
            <MenuIcon />
          </IconButton>
        </Box>

        <Divider sx={{ backgroundColor: '#555' }} />

        {/* Navigation Links */}
        <List>
          {navItems
            .filter((item) => !item.permission || hasPermission(currentUser, ...item.permission))
            .map((item) => (
              <ListItem
                key={item.key}
                disablePadding
                sx={{ display: 'block' }}
              >
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    padding: '10px 16px',
                    color: isActive ? '#00e5ff' : '#ffffff',
                    backgroundColor: isActive ? '#2b2b3c' : 'transparent',
                    borderRadius: '4px',
                    margin: '4px 8px',
                  })}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} />}
                </NavLink>
              </ListItem>
            ))}
        </List>

        {/* Pod Actions Link */}
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <NavLink
              to="/dashboard/analyzer/pod-actions"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                padding: '10px 16px',
                color: isActive ? '#00e5ff' : '#ffffff',
                backgroundColor: isActive ? '#2b2b3c' : 'transparent',
                borderRadius: '4px',
                margin: '4px 8px',
              })}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
                <PodIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Pod Actions" />}
            </NavLink>
          </ListItem>
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Bottom User Section */}
        <Box sx={{ px: 2, pb: 2 }}>
          {!collapsed ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#00bcd4' }}>
                {currentUser?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2">{currentUser?.username}</Typography>
                <Typography variant="caption" color="gray">
                  {currentUser?.role}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Tooltip title={currentUser?.username}>
              <Avatar sx={{ bgcolor: '#00bcd4' }}>
                {currentUser?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
