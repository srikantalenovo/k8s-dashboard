// src/views/PodActionsView/PodActionTable.js
import React, { useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Chip
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import TerminalIcon from "@mui/icons-material/Terminal";
import ScaleIcon from "@mui/icons-material/Scale";
import UninstallIcon from "@mui/icons-material/RemoveCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";

const API_PREFIXES = [
  "/api/pod-actions",
  "/api/podactions"
];

const tryRequestFallback = async (paths, options = {}) => {
  for (const p of paths) {
    try {
      const res = await fetch(p, options);
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await res.json();
        return await res.text();
      }
      // if 4xx/5xx, continue trying next path
    } catch (e) {
      // ignore and try next
    }
  }
  throw new Error("All endpoints failed");
};

export default function PodActionTable({ title, type, data, namespace = "default", onActionComplete = () => {}, statusMeta }) {
  // type: "pods" | "deployments" | "helm"
  const [confirm, setConfirm] = useState({ open: false, action: null, item: null });
  const [logDialog, setLogDialog] = useState({ open: false, content: "", name: "" });
  const [scaleDialog, setScaleDialog] = useState({ open: false, name: "", replicas: 1 });
  const [busy, setBusy] = useState(false);

  const statusBadge = (status) => {
    const meta = statusMeta ? statusMeta(status) : { color: "text.secondary", Icon: null, label: status };
    const Icon = meta.Icon;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {Icon ? <Icon sx={{ color: meta.color }} fontSize="small" /> : null}
        <Typography sx={{ color: meta.color, fontWeight: 600 }}>{meta.label || status}</Typography>
      </Box>
    );
  };

  // Build endpoints per action with fallbacks
  const endpointFor = (action, resourceName, replicas = undefined) => {
    // Pod actions
    if (type === "pods") {
      if (action === "list") return API_PREFIXES.map(p => `${p}/pods?namespace=${namespace}`);
      if (action === "delete") return API_PREFIXES.map(p => `${p}/pods/${resourceName}?namespace=${namespace}`);
      if (action === "restart") return API_PREFIXES.map(p => `${p}/pods/${resourceName}/restart?namespace=${namespace}`);
      if (action === "logs") return API_PREFIXES.map(p => `${p}/pods/${resourceName}/logs?namespace=${namespace}`).concat(API_PREFIXES.map(p=>`${p}/pods/${resourceName}/logs`));
    }
    if (type === "deployments") {
      if (action === "list") return API_PREFIXES.map(p => `${p}/deployments?namespace=${namespace}`);
      if (action === "restart") return API_PREFIXES.map(p => `${p}/deployments/${resourceName}/restart?namespace=${namespace}`);
      if (action === "delete") return API_PREFIXES.map(p => `${p}/deployments/${resourceName}?namespace=${namespace}`);
      if (action === "scale") return API_PREFIXES.map(p => `${p}/deployments/${resourceName}/scale?namespace=${namespace}`);
    }
    if (type === "helm") {
      if (action === "list") return API_PREFIXES.map(p => `${p}/helm?namespace=${namespace}`).concat(API_PREFIXES.map(p=>`${p}/helm-releases?namespace=${namespace}`));
      if (action === "uninstall") return API_PREFIXES.map(p => `${p}/helm/${resourceName}?namespace=${namespace}`).concat(API_PREFIXES.map(p=>`${p}/helm/uninstall/${resourceName}?namespace=${namespace}`));
    }
    return [""];
  };

  const handleConfirmOpen = (action, item) => setConfirm({ open: true, action, item });
  const handleConfirmClose = () => setConfirm({ open: false, action: null, item: null });

  const performAction = async () => {
    const { action, item } = confirm;
    if (!action || !item) return;
    setBusy(true);

    try {
      if (action === "logs" && type === "pods") {
        const paths = endpointFor("logs", item.name);
        const res = await tryRequestFallback(paths);
        setLogDialog({ open: true, content: typeof res === "string" ? res : JSON.stringify(res, null, 2), name: item.name });
      } else if (action === "delete") {
        const paths = endpointFor("delete", item.name);
        // DELETE
        await tryRequestFallback(paths, { method: "DELETE" });
        await onActionComplete();
      } else if (action === "restart") {
        const paths = endpointFor("restart", item.name);
        await tryRequestFallback(paths, { method: "POST" });
        await onActionComplete();
      } else if (action === "uninstall") {
        const paths = endpointFor("uninstall", item.name);
        await tryRequestFallback(paths, { method: "DELETE" });
        await onActionComplete();
      }
    } catch (err) {
      console.error("Action failed:", err);
      // Optionally show toast
    } finally {
      setBusy(false);
      handleConfirmClose();
    }
  };

  const openScale = (item) => {
    setScaleDialog({ open: true, name: item.name, replicas: Number(item.replicas || 1) });
  };

  const submitScale = async () => {
    setBusy(true);
    try {
      const paths = endpointFor("scale", scaleDialog.name);
      // prefer POST with JSON body
      await tryRequestFallback(paths, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replicas: Number(scaleDialog.replicas) })
      });
      await onActionComplete();
    } catch (err) {
      console.error("Scale failed:", err);
    } finally {
      setBusy(false);
      setScaleDialog({ open: false, name: "", replicas: 1 });
    }
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              {type === "deployments" && <TableCell sx={{ fontWeight: 700 }}>Replicas</TableCell>}
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!data || data.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No resources found.</TableCell>
              </TableRow>
            ) : data.map((item, idx) => {
              const st = item.status || item.raw?.status || "UNKNOWN";
              const meta = statusMeta ? statusMeta(st) : { color: "text.secondary", Icon: null, label: st };
              const Icon = meta.Icon;
              return (
                <TableRow key={`${type}-${idx}`} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.namespace}</Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {Icon ? <Icon sx={{ color: meta.color }} fontSize="small" /> : null}
                      <Typography sx={{ color: meta.color, fontWeight: 600 }}>{meta.label || st}</Typography>
                    </Box>
                  </TableCell>

                  {type === "deployments" && <TableCell>{item.replicas ?? "-"}</TableCell>}

                  <TableCell>
                    {type === "pods" && (
                      <>
                        <Tooltip title="View logs">
                          <IconButton size="small" onClick={() => handleConfirmOpen("logs", item)}>
                            <TerminalIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restart pod">
                          <IconButton size="small" color="warning" onClick={() => handleConfirmOpen("restart", item)}>
                            <RestartAltIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete pod">
                          <IconButton size="small" color="error" onClick={() => handleConfirmOpen("delete", item)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {type === "deployments" && (
                      <>
                        <Tooltip title="Restart deployment">
                          <IconButton size="small" color="warning" onClick={() => handleConfirmOpen("restart", item)}>
                            <RestartAltIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Scale deployment">
                          <IconButton size="small" onClick={() => openScale(item)}>
                            <ScaleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete deployment">
                          <IconButton size="small" color="error" onClick={() => handleConfirmOpen("delete", item)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {type === "helm" && (
                      <Tooltip title="Uninstall Helm release">
                        <IconButton size="small" color="error" onClick={() => handleConfirmOpen("uninstall", item)}>
                          <UninstallIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm dialog */}
      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, action: null, item: null })}>
        <DialogTitle>Confirm {confirm.action}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to <strong>{confirm.action}</strong> <code>{confirm.item?.name}</code> ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, action: null, item: null })}>Cancel</Button>
          <Button color="error" onClick={performAction} disabled={busy}>
            {busy ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logs dialog */}
      <Dialog open={logDialog.open} onClose={() => setLogDialog({ open: false, content: "", name: "" })} fullWidth maxWidth="lg">
        <DialogTitle>
          Logs — {logDialog.name}
          <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={() => setLogDialog({ open: false, content: "", name: "" })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#0b1220", color: "#e6eef8", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13 }}>
            <Typography component="pre">{logDialog.content}</Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialog({ open: false, content: "", name: "" })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Scale dialog */}
      <Dialog open={scaleDialog.open} onClose={() => setScaleDialog({ open: false, name: "", replicas: 1 })}>
        <DialogTitle>Scale Deployment — {scaleDialog.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", gap: 2, mt: 1 }}>
          <TextField
            label="Replicas"
            type="number"
            value={scaleDialog.replicas}
            onChange={(e) => setScaleDialog(d => ({ ...d, replicas: Number(e.target.value || 0) }))}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScaleDialog({ open: false, name: "", replicas: 1 })}>Cancel</Button>
          <Button onClick={submitScale} variant="contained">Scale</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
