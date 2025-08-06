// src/components/Sidebar.js
import React from "react";
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DescriptionIcon from "@mui/icons-material/Description";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;

const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      text: "Home",
      icon: <DashboardIcon />,
      route: "/dashboard",
      permission: "dashboard:view",
    },
    {
      text: "Resources",
      icon: <StorageIcon />,
      route: "/dashboard/resources",
      permission: "resources:view",
    },
    {
      text: "Analyzer",
      icon: <AnalyticsIcon />,
      route: "/dashboard/analyzer",
      permission: "analyzer:view",
    },
    {
      text: "Logs",
      icon: <DescriptionIcon />,
      route: "/dashboard/logs",
      permission: "logs:view",
    },
  ];

  const hasPermission = (perm) => {
    return user?.permissions?.includes(perm);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item) =>
          hasPermission(item.permission) ? (
            <ListItem button key={item.text} onClick={() => navigate(item.route)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ) : null
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
