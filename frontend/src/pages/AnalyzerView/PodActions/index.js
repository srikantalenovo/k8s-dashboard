import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import TerminalIcon from "@mui/icons-material/Terminal";
import ScaleIcon from "@mui/icons-material/SettingsEthernet";
import AppsIcon from "@mui/icons-material/Apps";
import { styled } from "@mui/material/styles";

const GradientCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(135deg, #2196F3 30%, #21CBF3 90%)",
  color: "#fff",
  borderRadius: 16,
  boxShadow: theme.shadows[5],
  transition: "transform 0.3s",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: theme.shadows[8],
  },
}));

const PodActions = () => {
  const [podData, setPodData] = useState([]);
  const [deploymentData, setDeploymentData] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: "",
    resourceType: "",
    resourceName: "",
    namespace: "",
  });
  const [showErrorsOnly, setShowErrorsOnly] = useState(true);

  useEffect(() => {
    fetchData();
  }, [showErrorsOnly]);

  const fetchData = async () => {
    const res = await fetch("/api/k8s/analyzer/health-summary");
    const data = await res.json();
    setPodData(showErrorsOnly ? data.errorPods : data.allPods || []);
    setDeploymentData(showErrorsOnly ? data.unhealthyDeployments : data.allDeployments || []);
    fetchHelmReleases();
  };

  const fetchHelmReleases = async () => {
    const res = await fetch("/api/k8s/pod-actions/helm/releases");
    const data = await res.json();
    setHelmReleases(data || []);
  };

  const handleAction = async () => {
    const { action, resourceType, resourceName, namespace } = confirmDialog;
    let url = "";
    let method = "POST";

    switch (action) {
      case "delete":
        url = `/api/k8s/pod-actions/${resourceType}/delete`;
        break;
      case "restart":
        url = `/api/k8s/pod-actions/${resourceType}/restart`;
        break;
      case "uninstall":
        url = `/api/k8s/pod-actions/helm/uninstall`;
        break;
      default:
        return;
    }

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: resourceName, namespace }),
    });

    setConfirmDialog({ ...confirmDialog, open: false });
    fetchData();
  };

  const openConfirm = (action, resourceType, resourceName, namespace) => {
    setConfirmDialog({
      open: true,
      action,
      resourceType,
      resourceName,
      namespace,
    });
  };

  const handleLogModal = async (name, namespace) => {
    const res = await fetch(`/api/k8s/pod-actions/pod/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, namespace }),
    });
    const data = await res.text();
    setSelectedLog(data);
    setLogModalOpen(true);
  };

  const renderActionButtons = (type, name, namespace) => (
    <Box display="flex" gap={1}>
      <Tooltip title="Restart">
        <IconButton
          color="warning"
          onClick={() => openConfirm("restart", type, name, namespace)}
        >
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          color="error"
          onClick={() => openConfirm("delete", type, name, namespace)}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      {type === "pod" && (
        <Tooltip title="View Logs">
          <IconButton
            color="primary"
            onClick={() => handleLogModal(name, namespace)}
          >
            <TerminalIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Pod Actions
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography>Show Only Error Resources</Typography>
        <Switch
          checked={showErrorsOnly}
          onChange={() => setShowErrorsOnly(!showErrorsOnly)}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Pods Card */}
        <Grid item xs={12} md={4}>
          <GradientCard>
            <CardContent>
              <Typography variant="h6">
                <AppsIcon /> Pods ({podData.length})
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>

        {/* Deployments Card */}
        <Grid item xs={12} md={4}>
          <GradientCard>
            <CardContent>
              <Typography variant="h6">
                <ScaleIcon /> Deployments ({deploymentData.length})
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>

        {/* Helm Card */}
        <Grid item xs={12} md={4}>
          <GradientCard>
            <CardContent>
              <Typography variant="h6">
                <AppsIcon /> Helm Releases ({helmReleases.length})
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>
      </Grid>

      {/* Table */}
      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Resource Table
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Namespace</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {podData.map((pod, index) => (
                <TableRow key={`pod-${index}`}>
                  <TableCell>Pod</TableCell>
                  <TableCell>{pod.name}</TableCell>
                  <TableCell>{pod.namespace}</TableCell>
                  <TableCell>
                    {renderActionButtons("pod", pod.name, pod.namespace)}
                  </TableCell>
                </TableRow>
              ))}
              {deploymentData.map((dep, index) => (
                <TableRow key={`dep-${index}`}>
                  <TableCell>Deployment</TableCell>
                  <TableCell>{dep.name}</TableCell>
                  <TableCell>{dep.namespace}</TableCell>
                  <TableCell>
                    {renderActionButtons("deployment", dep.name, dep.namespace)}
                  </TableCell>
                </TableRow>
              ))}
              {helmReleases.map((rel, index) => (
                <TableRow key={`helm-${index}`}>
                  <TableCell>Helm</TableCell>
                  <TableCell>{rel.name}</TableCell>
                  <TableCell>{rel.namespace}</TableCell>
                  <TableCell>
                    <Tooltip title="Uninstall Helm Release">
                      <IconButton
                        color="error"
                        onClick={() =>
                          openConfirm("uninstall", "helm", rel.name, rel.namespace)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Logs Modal */}
      <Modal open={logModalOpen} onClose={() => setLogModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "80%",
            height: "80%",
            bgcolor: "#fff",
            p: 2,
            overflowY: "scroll",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pod Logs
          </Typography>
          <pre>{selectedLog}</pre>
        </Box>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>Confirm {confirmDialog.action}</DialogTitle>
        <DialogContent>
          Are you sure you want to {confirmDialog.action}{" "}
          <b>{confirmDialog.resourceName}</b> in{" "}
          <b>{confirmDialog.namespace}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button color="error" onClick={handleAction}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PodActions;
