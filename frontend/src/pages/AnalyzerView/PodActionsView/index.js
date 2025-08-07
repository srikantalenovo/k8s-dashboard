import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import TerminalIcon from "@mui/icons-material/Terminal";
import ConstructionIcon from "@mui/icons-material/Construction";
import AppsIcon from "@mui/icons-material/Apps";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ResourceTable from "../PodActionsView/PodActionTable";

const PodActionsView = () => {
  const [resources, setResources] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [logModal, setLogModal] = useState({ open: false, logs: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/k8s/analyzer/health-summary");
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error("Failed to fetch resource summary", err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleLogModal = async (namespace, name) => {
    try {
      const res = await fetch(
        `/api/k8s/pod-actions/pod/logs?namespace=${namespace}&podName=${name}&containerName=${name}`
      );
      const data = await res.text();
      setLogModal({ open: true, logs: data });
    } catch (err) {
      console.error("Error fetching logs", err);
    }
  };

  const handleAction = (type, kind, namespace, resourceName) => {
    let url = "";
    let method = "POST";
    let body = { namespace, name: resourceName };

    switch (kind) {
      case "Pod":
        if (type === "delete") url = "/api/k8s/pod-actions/pod/delete";
        if (type === "restart") url = "/api/k8s/pod-actions/pod/restart";
        break;
      case "Deployment":
        if (type === "delete") url = "/api/k8s/pod-actions/deployment/delete";
        if (type === "restart") url = "/api/k8s/pod-actions/deployment/restart";
        break;
      case "Helm":
        if (type === "uninstall") {
          url = `/api/k8s/pod-actions/helm/uninstall/${namespace}/${resourceName}`;
          method = "DELETE";
          body = null;
        }
        break;
      default:
        return;
    }

    setConfirmDialog({
      open: true,
      title: `Are you sure you want to ${type} ${kind.toLowerCase()} "${resourceName}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            ...(body ? { body: JSON.stringify(body) } : {}),
          });
          if (res.ok) {
            fetchResources();
          } else {
            alert("Failed to perform action.");
          }
        } catch (err) {
          console.error("Action error", err);
        } finally {
          setConfirmDialog({ open: false, title: "", onConfirm: () => {} });
        }
      },
    });
  };

  const renderResourceCard = (title, icon, items, kind) => (
    <Card
      sx={{
        background: "linear-gradient(to right, #6a11cb, #2575fc)",
        color: "#fff",
        boxShadow: 4,
        borderRadius: 3,
        transition: "transform 0.2s",
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Box mt={2}>
          {items?.length === 0 ? (
            <Typography>No items found</Typography>
          ) : (
            items?.slice(0, 3)?.map(({ name, namespace }, i) => (
              <Box
                key={i}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography fontWeight="bold">{name}</Typography>
                <Box display="flex" gap={1}>
                  {kind === "Pod" && (
                    <>
                      <Tooltip title="View Logs">
                        <IconButton
                          onClick={() => handleLogModal(namespace, name)}
                          color="inherit"
                        >
                          <TerminalIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Restart">
                        <IconButton
                          onClick={() =>
                            handleAction("restart", kind, namespace, name)
                          }
                          color="inherit"
                        >
                          <RestartAltIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() =>
                        handleAction("delete", kind, namespace, name)
                      }
                      color="inherit"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  {kind === "Helm" && (
                    <Tooltip title="Uninstall">
                      <IconButton
                        onClick={() =>
                          handleAction("uninstall", kind, namespace, name)
                        }
                        color="inherit"
                      >
                        <RocketLaunchIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Pod Actions
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
        }
        label="Show All Resources"
      />
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={4}>
          {renderResourceCard(
            "Pods",
            <AppsIcon />,
            showAll ? resources.pods : resources.crashLoopBackOffPods,
            "Pod"
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderResourceCard(
            "Deployments",
            <ConstructionIcon />,
            showAll ? resources.deployments : resources.unhealthyDeployments,
            "Deployment"
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderResourceCard(
            "Helm Releases",
            <RocketLaunchIcon />,
            resources.helmReleases,
            "Helm"
          )}
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Resource Table
        </Typography>
        <ResourceTable
          pods={showAll ? resources.pods : resources.crashLoopBackOffPods}
          onDelete={(ns, name) => handleAction("delete", "Pod", ns, name)}
          onRestart={(ns, name) => handleAction("restart", "Pod", ns, name)}
          onLogView={(ns, name) => handleLogModal(ns, name)}
        />
      </Box>

      <Modal open={logModal.open} onClose={() => setLogModal({ open: false })}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            bgcolor: "#121212",
            color: "#00ffcc",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            fontFamily: "monospace",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pod Logs
          </Typography>
          <pre>{logModal.logs}</pre>
        </Box>
      </Modal>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false })}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.title}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>Cancel</Button>
          <Button onClick={confirmDialog.onConfirm} variant="contained" color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PodActionsView;
