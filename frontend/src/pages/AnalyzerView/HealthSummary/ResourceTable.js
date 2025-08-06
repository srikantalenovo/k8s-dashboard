// src/pages/AnalyzerView/HealthSummary/ResourceTable.js

import React from 'react';

export default function ResourceTable({ title, data, type }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Namespace</th>
            <th style={cellStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((res, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={cellStyle}>{res.name}</td>
              <td style={cellStyle}>{res.namespace || '-'}</td>
              <td style={{ ...cellStyle, color: 'red', fontWeight: 'bold' }}>{res.status || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  padding: '0.5rem',
  textAlign: 'left'
};
