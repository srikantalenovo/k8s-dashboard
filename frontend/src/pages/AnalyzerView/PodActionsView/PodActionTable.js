import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Button, TextField, Tooltip, Typography
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleIcon from "@mui/icons-material/Article";
import ScaleIcon from "@mui/icons-material/OpenInFull";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

export default function PodActionTable({ type, data, onActionComplete }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [logModal, setLogModal] = useState({ open: false, logs: "" });
  const [scaleValue, setScaleValue] = useState("");

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      const { actionType, name, namespace } = confirmAction;
      let url = `/api/k8s/pod-actions/${actionType}`;
      let options = { method: "POST", headers: { "Content-Type": "application/json" } };

      if (actionType === "scale") {
        options.body = JSON.stringify({ name, namespace, replicas: scaleValue });
      } else {
        options.body = JSON.stringify({ name, namespace });
      }

      const res = await fetch(url, options);
      if (res.ok) {
        onActionComplete();
      }
    } catch (err) {
      console.error("Action failed", err);
    }
    setConfirmAction(null);
  };

  const fetchLogs = async (name, namespace) => {
    try {
      const res = await fetch(`/api/k8s/pod-actions/logs?name=${name}&namespace=${namespace}`);
      const text = await res.text();
      setLogModal({ open: true, logs: text });
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const actionButtons = (row) => {
    switch (type) {
      case "pods":
        return (
          <>
            <Tooltip title="View Logs">
              <IconButton onClick={() => fetchLogs(row.name, row.namespace)} color="primary">
                <ArticleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Restart Pod">
              <IconButton
                onClick={() => setConfirmAction({ actionType: "restart", name: row.name, namespace: row.namespace })}
                color="warning"
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Pod">
              <IconButton
                onClick={() => setConfirmAction({ actionType: "delete", name: row.name, namespace: row.namespace })}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        );
      case "deployments":
        return (
          <>
            <Tooltip title="Scale Deployment">
              <IconButton
                onClick={() => setConfirmAction({ actionType: "scale", name: row.name, namespace: row.namespace })}
                color="secondary"
              >
                <ScaleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Restart Deployment">
              <IconButton
                onClick={() => setConfirmAction({ actionType: "restart", name: row.name, namespace: row.namespace })}
                color="warning"
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Deployment">
              <IconButton
                onClick={() => setConfirmAction({ actionType: "delete", name: row.name, namespace: row.namespace })}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        );
      case "helm":
        return (
          <Tooltip title="Uninstall Helm Release">
            <IconButton
              onClick={() => setConfirmAction({ actionType: "uninstall-helm", name: row.name, namespace: row.namespace })}
              color="error"
            >
              <RemoveCircleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Namespace</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="right"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.namespace}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: row.status === "Running" ? "green" : "red",
                        fontWeight: "bold"
                      }}
                    >
                      {row.status}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{actionButtons(row)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to{" "}
            <b>{confirmAction?.actionType}</b> {confirmAction?.name} in{" "}
            {confirmAction?.namespace}?
          </DialogContentText>
          {confirmAction?.actionType === "scale" && (
            <TextField
              autoFocus
              margin="dense"
              label="Replicas"
              type="number"
              fullWidth
              variant="outlined"
              value={scaleValue}
              onChange={(e) => setScaleValue(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button onClick={handleAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logs Modal */}
      <Dialog
        open={logModal.open}
        onClose={() => setLogModal({ open: false, logs: "" })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Pod Logs</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {logModal.logs || "No logs found"}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogModal({ open: false, logs: "" })}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
