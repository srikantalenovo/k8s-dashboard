import React, { useState } from 'react';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
  GridRowModes,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  useTheme,
} from '@mui/material';
import {
  Refresh,
  Delete,
  Scale,
  WarningAmber,
} from '@mui/icons-material';
import { tokens } from '../../../theme';

const DeploymentTable = ({ deployments, namespace }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [replicas, setReplicas] = useState(0);

  const handleScale = async () => {
    try {
      await fetch(`/api/k8s/deployments/${selectedDeployment}/scale`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          namespace,
          replicas: parseInt(replicas)
        })
      });
      setScaleDialogOpen(false);
    } catch (error) {
      console.error('Scale failed:', error);
    }
  };

  const handleDelete = async (deploymentName) => {
    try {
      await fetch(`/api/k8s/deployments/${deploymentName}?namespace=${namespace}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRestart = async (deploymentName) => {
    try {
      await fetch(`/api/k8s/deployments/${deploymentName}/restart?namespace=${namespace}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Restart failed:', error);
    }
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Deployment', 
      flex: 1 
    },
    { 
      field: 'readyReplicas', 
      headerName: 'Ready',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`${params.value || 0}/${params.row.replicas || 0}`}
            color={
              params.value === params.row.replicas ? 'success' : 'error'
            }
            size="small"
          />
        </Box>
      )
    },
    { 
      field: 'replicas', 
      headerName: 'Replicas',
      width: 120,
      type: 'number'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Tooltip title="Scale"><Scale fontSize="small" /></Tooltip>}
          onClick={() => {
            setSelectedDeployment(params.row.name);
            setReplicas(params.row.replicas);
            setScaleDialogOpen(true);
          }}
          label="Scale"
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
      backgroundColor: colors.primary[400],
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <DataGrid
        rows={deployments}
        columns={columns}
        loading={!deployments.length}
        slots={{ 
          toolbar: GridToolbar,
          loadingOverlay: LinearProgress,
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

      <Dialog open={scaleDialogOpen} onClose={() => setScaleDialogOpen(false)}>
        <DialogTitle>Scale Deployment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Replicas"
            type="number"
            fullWidth
            variant="outlined"
            value={replicas}
            onChange={(e) => setReplicas(e.target.value)}
            inputProps={{ min: 0, max: 20 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScaleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScale} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeploymentTable;