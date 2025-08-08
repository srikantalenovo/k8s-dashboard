// HelmActionTable.js
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

export default function HelmActionTable({ releases, onUninstall }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);

  const handleUninstallClick = (release) => {
    setSelectedRelease(release);
    setConfirmOpen(true);
  };

  const confirmUninstall = () => {
    if (selectedRelease) {
      onUninstall(selectedRelease);
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Revision</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {releases.map((rel) => (
              <TableRow key={rel.name}>
                <TableCell>{rel.name}</TableCell>
                <TableCell>{rel.namespace}</TableCell>
                <TableCell>{rel.revision}</TableCell>
                <TableCell>{rel.status}</TableCell>
                <TableCell>{rel.updated}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleUninstallClick(rel)}
                  >
                    Uninstall
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Uninstall Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Uninstall</DialogTitle>
        <DialogContent>
          Are you sure you want to uninstall Helm release <b>{selectedRelease?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmUninstall}>Uninstall</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
