import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArticleIcon from '@mui/icons-material/Article';
import StorageIcon from '@mui/icons-material/Storage';
import CloseIcon from '@mui/icons-material/Close';

const PodActionTable = ({ type, namespace }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [logs, setLogs] = useState('');
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [replicas, setReplicas] = useState(1);

  useEffect(() => {
    fetchData();
  }, [type, namespace]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '';
      if (type === 'pods') url = `/api/pod-actions/pods?namespace=${namespace}`;
      if (type === 'deployments') url = `/api/pod-actions/deployments?namespace=${namespace}`;
      if (type === 'helm') url = `/api/pod-actions/helm?namespace=${namespace}`;
      
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (action, resource) => {
    setSelectedResource(resource);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!selectedResource || !confirmAction) return;
    try {
      let url = '';
      let method = 'POST';

      if (confirmAction === 'delete') {
        url = `/api/pod-actions/${type}/${selectedResource.name}?namespace=${namespace}`;
        method = 'DELETE';
      }
      if (confirmAction === 'restart') {
        url = `/api/pod-actions/${type}/${selectedResource.name}/restart?namespace=${namespace}`;
      }
      if (confirmAction === 'uninstall') {
        url = `/api/pod-actions/helm/${selectedResource.name}/uninstall?namespace=${namespace}`;
      }

      await fetch(url, { method });
      fetchData();
    } catch (err) {
      console.error(`Error executing ${confirmAction} on ${type}:`, err);
    } finally {
      setConfirmOpen(false);
    }
  };

  const openLogs = async (resource) => {
    setSelectedResource(resource);
    setLogs('');
    setLogModalOpen(true);
    try {
      const res = await fetch(`/api/pod-actions/pods/${resource.name}/logs?namespace=${namespace}`);
      const result = await res.text();
      setLogs(result);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const openScaleDialog = (resource) => {
    setSelectedResource(resource);
    setScaleModalOpen(true);
    setReplicas(resource.replicas || 1);
  };

  const handleScale = async () => {
    try {
      await fetch(`/api/pod-actions/deployments/${selectedResource.name}/scale?namespace=${namespace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas })
      });
      fetchData();
    } catch (err) {
      console.error('Error scaling deployment:', err);
    } finally {
      setScaleModalOpen(false);
    }
  };

  return (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                {type === 'deployments' && <TableCell>Replicas</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  {type === 'deployments' && <TableCell>{item.replicas}</TableCell>}
                  <TableCell>
                    {type === 'pods' && (
                      <>
                        <Tooltip title="View Logs">
                          <IconButton onClick={() => openLogs(item)}><ArticleIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Restart Pod">
                          <IconButton onClick={() => handleConfirm('restart', item)}><RestartAltIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Pod">
                          <IconButton onClick={() => handleConfirm('delete', item)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </>
                    )}
                    {type === 'deployments' && (
                      <>
                        <Tooltip title="Restart Deployment">
                          <IconButton onClick={() => handleConfirm('restart', item)}><RestartAltIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Scale Deployment">
                          <IconButton onClick={() => openScaleDialog(item)}><StorageIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Deployment">
                          <IconButton onClick={() => handleConfirm('delete', item)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </>
                    )}
                    {type === 'helm' && (
                      <Tooltip title="Uninstall Release">
                        <IconButton onClick={() => handleConfirm('uninstall', item)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm {confirmAction}</DialogTitle>
        <DialogContent>
          Are you sure you want to {confirmAction} "{selectedResource?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={executeAction} color="error">Yes</Button>
        </DialogActions>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Logs - {selectedResource?.name}
          <IconButton onClick={() => setLogModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{logs}</Typography>
        </DialogContent>
      </Dialog>

      {/* Scale Dialog */}
      <Dialog open={scaleModalOpen} onClose={() => setScaleModalOpen(false)}>
        <DialogTitle>Scale Deployment - {selectedResource?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Replicas"
            type="number"
            value={replicas}
            onChange={(e) => setReplicas(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScaleModalOpen(false)}>Cancel</Button>
          <Button onClick={handleScale} variant="contained">Scale</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PodActionTable;
