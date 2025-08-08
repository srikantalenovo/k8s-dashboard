import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Paper
} from "@mui/material";

export default function PodActionTable({ pods = [], fetchPods }) {
  const [logModal, setLogModal] = useState({ open: false, logs: "" });

  const handleDelete = async (name) => {
    if (window.confirm(`Delete pod ${name}?`)) {
      await fetch(`/api/pod-actions/pods/${name}`, { method: "DELETE" });
      fetchPods();
    }
  };

  const handleRestart = async (name) => {
    if (window.confirm(`Restart pod ${name}?`)) {
      await fetch(`/api/pod-actions/pods/${name}/restart`, { method: "POST" });
      fetchPods();
    }
  };

  const handleViewLogs = async (name) => {
    const res = await fetch(`/api/pod-actions/pods/${name}/logs`);
    const logs = await res.text();
    setLogModal({ open: true, logs });
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pods.length > 0 ? (
              pods.map((pod, idx) => (
                <TableRow key={idx}>
                  <TableCell>{pod.name}</TableCell>
                  <TableCell>{pod.status}</TableCell>
                  <TableCell>{pod.namespace}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleViewLogs(pod.name)}>Logs</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(pod.name)}>Delete</Button>
                    <Button size="small" color="warning" onClick={() => handleRestart(pod.name)}>Restart</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No pods available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={logModal.open} onClose={() => setLogModal({ open: false, logs: "" })} maxWidth="md" fullWidth>
        <DialogTitle>Pod Logs</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre">{logModal.logs}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogModal({ open: false, logs: "" })}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
