import React, { useState } from 'react';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
  GridRowModes,
  useGridApiRef,
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
  Refresh,
  Article,
  WarningAmber,
  Visibility,
} from '@mui/icons-material';
import LogsModal from './LogsModal';
import ActionToolbar from './ActionToolbar';
import { tokens } from '../../../../theme';

const PodTable = ({ pods, namespace, onNamespaceChange, onReload }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const apiRef = useGridApiRef();
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);

  const handleDelete = async (podName) => {
    try {
      await fetch(`/api/k8s/pods/${podName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      onReload();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRestart = async (podName) => {
    try {
      await fetch(`/api/k8s/pods/${podName}/restart?namespace=${namespace}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      onReload();
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
          sx={{ 
            width: 80,
            fontWeight: 600 
          }}
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
      field: 'nodeName',
      headerName: 'Node',
      flex: 1
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
          disabled={!params.row.deletable}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ 
      height: '75vh',
      width: '100%',
      backgroundColor: colors.primary[400],
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <ActionToolbar
        namespace={namespace}
        onNamespaceChange={onNamespaceChange}
        onReload={onReload}
        resourceType="pods"
      />
      
      <DataGrid
        apiRef={apiRef}
        rows={pods}
        columns={columns}
        loading={!pods.length}
        slots={{ 
          toolbar: GridToolbar,
          loadingOverlay: LinearProgress,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${colors.grey[700]} !important`,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: colors.blueAccent[700],
            borderBottom: `1px solid ${colors.grey[800]}`,
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: colors.primary[400],
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${colors.grey[800]}`,
            backgroundColor: colors.blueAccent[700],
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