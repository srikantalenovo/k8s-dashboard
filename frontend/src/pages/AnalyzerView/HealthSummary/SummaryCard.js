// src/pages/AnalyzerView/HealthSummary/SummaryCard.js

import React from 'react';

const colors = {
  red: '#f44336',
  orange: '#ff9800',
  gray: '#9e9e9e',
  purple: '#9c27b0',
};

export default function SummaryCard({ title, count, color }) {
  return (
    <div style={{
      flex: 1,
      background: colors[color] || '#ccc',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <h1>{count}</h1>
    </div>
  );
}
