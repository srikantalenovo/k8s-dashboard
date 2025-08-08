// PodActionsView/DeploymentActionTable.js
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
} from "@mui/material";

export default function DeploymentActionTable() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pod-actions/deployments");
      if (!res.ok) throw new Error("Failed to fetch deployments");
      const data = await res.json();
      // Ensure we always set an array
      setDeployments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching deployments:", err);
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleRestart = async (name) => {
    if (window.confirm(`Restart deployment ${name}?`)) {
      await fetch(`/api/pod-actions/deployments/${name}/restart`, {
        method: "POST",
      });
      fetchDeployments();
    }
  };

  const handleDelete = async (name) => {
    if (window.confirm(`Delete deployment ${name}?`)) {
      await fetch(`/api/pod-actions/deployments/${name}`, {
        method: "DELETE",
      });
      fetchDeployments();
    }
  };

  const handleScale = async (name) => {
    const replicas = prompt("Enter number of replicas:");
    if (replicas !== null) {
      await fetch(`/api/pod-actions/deployments/${name}/scale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replicas: parseInt(replicas, 10) }),
      });
      fetchDeployments();
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Deployment Actions
      </Typography>
      {loading ? (
        <Typography sx={{ p: 2 }}>Loading deployments...</Typography>
      ) : deployments.length === 0 ? (
        <Typography sx={{ p: 2 }}>No deployments found.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Namespace</strong></TableCell>
              <TableCell><strong>Replicas</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deployments.map((deployment) => (
              <TableRow key={deployment.name}>
                <TableCell>{deployment.name}</TableCell>
                <TableCell>{deployment.namespace}</TableCell>
                <TableCell>{deployment.replicas}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleRestart(deployment.name)}
                    sx={{ mr: 1 }}
                  >
                    Restart
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(deployment.name)}
                    sx={{ mr: 1 }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleScale(deployment.name)}
                  >
                    Scale
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
}
