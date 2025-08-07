import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Link,
  IconButton, Box, Typography, Divider, Avatar, Tooltip, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Folder as ResourcesIcon,
  List as LogsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dns as PodIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const navItems = [
  { label: 'Home', icon: <HomeIcon />, key: 'Home' },
  { label: 'Analyzer', icon: <AnalyticsIcon />, key: 'Analyzer' },
  { label: 'Resources', icon: <ResourcesIcon />, key: 'Resources' },
  { label: 'Logs', icon: <LogsIcon />, key: 'Logs' }
];

const Sidebar = ({ currentView, setCurrentView, currentUser }) => {
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
          transition: 'width 0.3s'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo and Collapse Button */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: 2,
          py: 2
        }}>
          {!collapsed && <Typography variant="h6" sx={{ fontWeight: 'bold' }}>GrepMind</Typography>}
          <IconButton onClick={toggleCollapse} sx={{ color: '#ffffff' }}>
            <MenuIcon />
          </IconButton>
        </Box>

        <Divider sx={{ backgroundColor: '#555' }} />

        {/* Navigation Links */}
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.key}
              selected={currentView === item.key}
              onClick={() => setCurrentView(item.key)}
              sx={{
                color: currentView === item.key ? '#00e5ff' : '#ffffff',
                backgroundColor: currentView === item.key ? '#2b2b3c' : 'transparent',
                '&:hover': {
                  backgroundColor: '#333',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItem>
          ))}
        </List>

          <ListItemButton component={Link} to="/dashboard/analyzer/pod-actions">
            <ListItemIcon><PodIcon /></ListItemIcon>
            <ListItemText primary="Pod Actions" />
          </ListItemButton>

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
                <Typography variant="caption" color="gray">{currentUser?.role}</Typography>
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
