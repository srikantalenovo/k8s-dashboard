// src/views/PodActionsView/PodActionTable.js
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography
} from '@mui/material';

export default function PodActionTable() {
  const [pods, setPods] = useState([]);
  const [logModal, setLogModal] = useState(false);
  const [logs, setLogs] = useState('');
  const [selectedPod, setSelectedPod] = useState('');

  const fetchPods = async () => {
    const res = await fetch('/api/pod-actions/pods');
    const data = await res.json();
    setPods(data);
  };

  useEffect(() => {
    fetchPods();
  }, []);

  const handleRestart = async (name) => {
    if (window.confirm(`Restart pod ${name}?`)) {
      await fetch(`/api/pod-actions/pods/${name}/restart`, { method: 'POST' });
      fetchPods();
    }
  };

  const handleDelete = async (name) => {
    if (window.confirm(`Delete pod ${name}?`)) {
      await fetch(`/api/pod-actions/pods/${name}`, { method: 'DELETE' });
      fetchPods();
    }
  };

  const handleViewLogs = async (name) => {
    // For now just dummy text
    setSelectedPod(name);
    setLogs(`Logs for ${name}...`);
    setLogModal(true);
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Pod Name</TableCell>
            <TableCell>Namespace</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pods.map((pod) => (
            <TableRow key={pod.metadata.uid}>
              <TableCell>{pod.metadata.name}</TableCell>
              <TableCell>{pod.metadata.namespace}</TableCell>
              <TableCell>
                <Button onClick={() => handleViewLogs(pod.metadata.name)}>View Logs</Button>
                <Button onClick={() => handleRestart(pod.metadata.name)}>Restart</Button>
                <Button color="error" onClick={() => handleDelete(pod.metadata.name)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={logModal} onClose={() => setLogModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Logs - {selectedPod}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{logs}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
