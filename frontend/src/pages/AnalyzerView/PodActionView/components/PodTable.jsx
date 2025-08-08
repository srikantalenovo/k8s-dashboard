import React, { useState } from 'react';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Delete,
  Refresh,
  Article,
  WarningAmber,
} from '@mui/icons-material';
import LogsModal from './LogsModal';
import ActionToolbar from './ActionToolbar';

const PodTable = ({ pods, namespace, onNamespaceChange, onReload }) => {
  const theme = useTheme();
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);

  const handleDelete = async (podName) => {
    try {
      const res = await fetch(`/api/k8s/pods/${podName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(await res.text());
      onReload(); // Refresh pod list
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRestart = async (podName) => {
    try {
      const res = await fetch(`/api/k8s/pods/${podName}/restart?namespace=${namespace}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(await res.text());
      onReload(); // Refresh pod list
    } catch (error) {
      console.error('Restart failed:', error);
    }
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Pod Name', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.status === 'Failed' && (
            <WarningAmber color="error" fontSize="small" />
          )}
          <span>{params.value}</span>
        </Box>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value}
          size="small"
          color={
            params.value === 'Running' ? 'success' : 
            params.value === 'Failed' ? 'error' : 'warning'
          }
          variant="outlined"
          sx={{ width: 80, fontWeight: 600 }}
        />
      )
    },
    { 
      field: 'restarts', 
      headerName: 'Restarts',
      width: 100,
      type: 'number'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Tooltip title="View Logs"><Article fontSize="small" /></Tooltip>}
          onClick={() => {
            setSelectedPod(params.row);
            setLogsModalOpen(true);
          }}
          label="Logs"
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Restart"><Refresh fontSize="small" /></Tooltip>}
          onClick={() => handleRestart(params.row.name)}
          label="Restart"
          showInMenu
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Delete"><Delete fontSize="small" /></Tooltip>}
          onClick={() => handleDelete(params.row.name)}
          label="Delete"
          showInMenu
        />,
      ],
    },
  ];

  return (
    <Box sx={{ 
      height: '75vh',
      width: '100%',
      backgroundColor: theme.palette.background.default,
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <ActionToolbar
        namespace={namespace}
        onNamespaceChange={onNamespaceChange}
        onReload={onReload}
      />
      
      <DataGrid
        rows={pods}
        columns={columns}
        loading={!pods.length}
        slots={{ 
          toolbar: GridToolbar,
          loadingOverlay: LinearProgress,
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          },
        }}
      />
      
      <LogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        pod={selectedPod}
        namespace={namespace}
      />
    </Box>
  );
};

export default PodTable;