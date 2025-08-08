import React from 'react';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Delete,
  History,
  WarningAmber,
} from '@mui/icons-material';

const HelmTable = ({ releases, namespace }) => {
  const theme = useTheme();

  const handleUninstall = async (releaseName) => {
    try {
      await fetch(`/api/k8s/helm/releases/${releaseName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Release', 
      flex: 1 
    },
    { 
      field: 'namespace', 
      headerName: 'Namespace',
      width: 150
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
            params.value === 'deployed' ? 'success' : 
            params.value === 'failed' ? 'error' : 'warning'
          }
          variant="outlined"
        />
      )
    },
    { 
      field: 'version', 
      headerName: 'Version',
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
          icon={<Tooltip title="History"><History fontSize="small" /></Tooltip>}
          onClick={() => console.log('History:', params.row.name)}
          label="History"
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Uninstall"><Delete fontSize="small" /></Tooltip>}
          onClick={() => handleUninstall(params.row.name)}
          label="Uninstall"
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
      <DataGrid
        rows={releases}
        columns={columns}
        loading={!releases.length}
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
    </Box>
  );
};

export default HelmTable;