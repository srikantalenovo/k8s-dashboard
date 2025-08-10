// src/pages/Dashboard.js
import React from 'react';
import { Box, Container } from '@mui/material';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

import HomeView from './HomeView';
import AnalyzerView from './AnalyzerView';
import ResourcesView from './ResourcesView';
import LogsView from './LogsView';
import PodActionsView from './AnalyzerView/PodActionView/PodActionView';

import { hasPermission } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract current view key from URL, fallback to 'home' if none
  const pathSegments = location.pathname.split('/');
  // Example URL: /dashboard/home → pathSegments[2] = 'home'
  const currentView = pathSegments[2]?.toLowerCase() || 'home';

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={(view) => {
          // Navigate to the clicked view's URL
          navigate(`/dashboard/${view.toLowerCase()}`);
        }}
      />

      <Box sx={{ flexGrow: 1 }}>
        <Container maxWidth="xl" sx={{ p: 2 }}>
          <Header
            currentView={currentView}
            setCurrentView={(view) => {
              navigate(`/dashboard/${view.toLowerCase()}`);
            }}
            handleLogout={handleLogout}
            currentUser={currentUser}
          />

          <Routes>
            {/* Redirect /dashboard to /dashboard/home */}
            <Route path="/" element={<Navigate to="/dashboard/home" replace />} />

            <Route path="home" element={<HomeView />} />

            <Route
              path="analyzer/*"
              element={
                hasPermission(currentUser, 'analyzer', 'read') ? (
                  <AnalyzerView />
                ) : (
                  <Navigate to="/dashboard/home" replace />
                )
              }
            />

            <Route
              path="resources"
              element={
                hasPermission(currentUser, 'nodes', 'read') ? (
                  <ResourcesView currentUser={currentUser} />
                ) : (
                  <Navigate to="/dashboard/home" replace />
                )
              }
            />

            <Route
              path="logs"
              element={
                hasPermission(currentUser, 'logs', 'read') ? (
                  <LogsView />
                ) : (
                  <Navigate to="/dashboard/home" replace />
                )
              }
            />

            <Route
              path="analyzer/pod-actions"
              element={
                hasPermission(currentUser, 'analyzer', 'read') ? (
                  <PodActionsView />
                ) : (
                  <Navigate to="/dashboard/home" replace />
                )
              }
            />

            {/* Fallback: redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
