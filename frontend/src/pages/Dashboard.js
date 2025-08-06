// src/pages/Dashboard.js

import React, { useState } from 'react';
import AnalyzerView from './AnalyzerView';
import ResourcesView from './ResourcesView';
import LogsView from './LogsView'; // optional, can be placeholder

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('home');

  const renderView = () => {
    switch (selectedTab) {
      case 'analyzer':
        return <AnalyzerView />;
      case 'resources':
        return <ResourcesView />;
      case 'logs':
        return <LogsView />;
      default:
        return (
          <div style={{ padding: '20px' }}>
            <h2>🏠 Welcome to GrepMind Kubernetes Dashboard</h2>
            <p>This dashboard provides detailed insights into your Kubernetes cluster resources.</p>
            <p>Select a tab to get started with monitoring, analyzing, or managing your resources.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        backgroundColor: '#1e293b',
        color: 'white',
        fontWeight: 'bold',
        borderBottom: '3px solid #0ea5e9'
      }}>
        <button onClick={() => setSelectedTab('home')} style={tabStyle(selectedTab === 'home')}>🏠 Home</button>
        <button onClick={() => setSelectedTab('analyzer')} style={tabStyle(selectedTab === 'analyzer')}>🧠 Analyzer</button>
        <button onClick={() => setSelectedTab('resources')} style={tabStyle(selectedTab === 'resources')}>📦 Resources</button>
        <button onClick={() => setSelectedTab('logs')} style={tabStyle(selectedTab === 'logs')}>📄 Logs</button>
      </div>

      <div>
        {renderView()}
      </div>
    </div>
  );
};

const tabStyle = (active) => ({
  backgroundColor: active ? '#0ea5e9' : 'transparent',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderBottom: active ? '3px solid white' : '3px solid transparent',
  cursor: 'pointer',
  fontSize: '16px',
  transition: '0.2s ease-in-out'
});

export default Dashboard;
