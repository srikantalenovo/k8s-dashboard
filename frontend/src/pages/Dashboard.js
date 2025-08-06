import React, { useState, useContext } from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";
import HomeIcon from "@mui/icons-material/Home";
import InsightsIcon from "@mui/icons-material/Insights";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TerminalIcon from "@mui/icons-material/Terminal";
import Sidebar from "../components/Sidebar";
import MotionPaper from "../components/MotionPaper";
import { useAuth } from "../context/AuthContext";

// Importing modular views
import ResourcesView from "../pages/ResourcesView"; // ✅ NEW import

const DashboardContainer = styled(Box)({
  display: "flex",
  minHeight: "100vh",
});

const MainContent = styled(Box)({
  flexGrow: 1,
  padding: "2rem",
});

const Header = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
});

const GrepMindLogo = styled("img")({
  height: "40px",
});

const ViewContainer = styled(MotionPaper)({
  padding: "2rem",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
});

const Dashboard = () => {
  const [selectedView, setSelectedView] = useState("home");
  const { user } = useContext(useAuth);

  const checkPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };

  const currentUser = {
    username: user?.username,
    role: user?.role,
  };

  const renderView = () => {
    switch (selectedView) {
      case "home":
        return <Typography variant="h4">Welcome to GrepMind Dashboard</Typography>;
      case "resources":
        return checkPermission("resources:view") ? (
          <ResourcesView currentUser={currentUser} />
        ) : (
          <Typography>You do not have permission to view resources.</Typography>
        );
      case "analyzer":
        return checkPermission("analyzer:view") ? (
          <Typography variant="h6">Analyzer View coming soon</Typography>
        ) : (
          <Typography>You do not have permission to view analyzer.</Typography>
        );
      case "logs":
        return checkPermission("logs:view") ? (
          <Typography variant="h6">Logs View coming soon</Typography>
        ) : (
          <Typography>You do not have permission to view logs.</Typography>
        );
      default:
        return <Typography>Unknown view</Typography>;
    }
  };

  const navItems = [
    { label: "Home", value: "home", icon: <HomeIcon /> },
    {
      label: "Analyzer",
      value: "analyzer",
      icon: <InsightsIcon />,
      permission: "analyzer:view",
    },
    {
      label: "Resources",
      value: "resources",
      icon: <ListAltIcon />,
      permission: "resources:view",
    },
    {
      label: "Logs",
      value: "logs",
      icon: <TerminalIcon />,
      permission: "logs:view",
    },
  ];

  return (
    <DashboardContainer>
      <Sidebar
        items={navItems}
        selected={selectedView}
        onSelect={setSelectedView}
        checkPermission={checkPermission}
      />
      <MainContent>
        <Header>
          <GrepMindLogo src="/logo.png" alt="GrepMind Logo" />
          <Typography variant="h6">
            Logged in as {currentUser.username} ({currentUser.role})
          </Typography>
        </Header>
        <ViewContainer elevation={3}>{renderView()}</ViewContainer>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;
