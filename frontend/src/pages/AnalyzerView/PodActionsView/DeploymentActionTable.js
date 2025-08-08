// DeploymentActionTable.js
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from '@mui/material';

export default function DeploymentActionTable({ deployments, onRestart, onScale }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [replicaCount, setReplicaCount] = useState('');

  const handleRestartClick = (deployment) => {
    setSelectedDeployment(deployment);
    setConfirmOpen(true);
  };

  const handleScaleClick = (deployment) => {
    setSelectedDeployment(deployment);
    setReplicaCount('');
    setScaleOpen(true);
  };

  const confirmRestart = () => {
    if (selectedDeployment) {
      onRestart(selectedDeployment);
    }
    setConfirmOpen(false);
  };

  const confirmScale = () => {
    if (selectedDeployment && replicaCount !== '') {
      onScale(selectedDeployment, parseInt(replicaCount, 10));
    }
    setScaleOpen(false);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Replicas</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deployments.map((dep) => (
              <TableRow key={dep.name}>
                <TableCell>{dep.name}</TableCell>
                <TableCell>{dep.namespace}</TableCell>
                <TableCell>{dep.replicas}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleRestartClick(dep)}
                    sx={{ mr: 1 }}
                  >
                    Restart
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleScaleClick(dep)}
                  >
                    Scale
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Restart Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Restart</DialogTitle>
        <DialogContent>
          Are you sure you want to restart deployment <b>{selectedDeployment?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmRestart}>Restart</Button>
        </DialogActions>
      </Dialog>

      {/* Scale Dialog */}
      <Dialog open={scaleOpen} onClose={() => setScaleOpen(false)}>
        <DialogTitle>Scale Deployment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Replicas"
            type="number"
            fullWidth
            value={replicaCount}
            onChange={(e) => setReplicaCount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScaleOpen(false)}>Cancel</Button>
          <Button onClick={confirmScale}>Scale</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
