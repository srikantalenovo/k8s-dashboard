import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScaleIcon from '@mui/icons-material/TrackChanges';
import UninstallIcon from '@mui/icons-material/RemoveCircleOutline';
import UpgradeIcon from '@mui/icons-material/CloudUpload';
import RollbackIcon from '@mui/icons-material/Undo';

const ActionButtons = ({ type, resource, onActionComplete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeVersion, setUpgradeVersion] = useState('');
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackRevision, setRollbackRevision] = useState('');
  const [scaleValue, setScaleValue] = useState(resource.replicas || 1);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const openConfirm = (action) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
    setError(null);
  };

  const openScaleDialog = () => {
    setScaleValue(resource.replicas || 1);
    setScaleDialogOpen(true);
  };

  const closeScaleDialog = () => {
    setScaleDialogOpen(false);
    setError(null);
  };

  const openUpgradeDialog = () => {
    setUpgradeVersion('');
    setUpgradeDialogOpen(true);
  };

  const closeUpgradeDialog = () => {
    setUpgradeDialogOpen(false);
    setError(null);
  };

  const openRollbackDialog = () => {
    setRollbackRevision('');
    setRollbackDialogOpen(true);
  };

  const closeRollbackDialog = () => {
    setRollbackDialogOpen(false);
    setError(null);
  };

  const performAction = async () => {
    setActionLoading(true);
    setError(null);

    try {
      let url = '';
      let method = 'POST';
      let body = null;

      switch (type) {
        case 'pod':
          if (confirmAction === 'delete') {
            url = `/api/k8s/pods/${encodeURIComponent(resource.name)}?namespace=${encodeURIComponent(resource.namespace)}`;
            method = 'DELETE';
          } else if (confirmAction === 'restart') {
            url = `/api/k8s/pods/${encodeURIComponent(resource.name)}/restart?namespace=${encodeURIComponent(resource.namespace)}`;
          }
          break;

        case 'deployment':
          if (confirmAction === 'delete') {
            url = `/api/k8s/deployments/${encodeURIComponent(resource.name)}?namespace=${encodeURIComponent(resource.namespace)}`;
            method = 'DELETE';
          } else if (confirmAction === 'restart') {
            url = `/api/k8s/deployments/${encodeURIComponent(resource.name)}/restart?namespace=${encodeURIComponent(resource.namespace)}`;
          } else if (confirmAction === 'scale') {
            url = `/api/k8s/deployments/${encodeURIComponent(resource.name)}/scale?namespace=${encodeURIComponent(resource.namespace)}&replicas=${scaleValue}`;
            method = 'POST';
          }
          break;

        case 'helm':
          if (confirmAction === 'uninstall') {
            url = `/api/k8s/helm/releases/${encodeURIComponent(resource.name)}/uninstall?namespace=${encodeURIComponent(resource.namespace)}`;
          } else if (confirmAction === 'rollback') {
            url = `/api/k8s/helm/releases/${encodeURIComponent(resource.name)}/rollback?namespace=${encodeURIComponent(resource.namespace)}&revision=${encodeURIComponent(rollbackRevision)}`;
          } else if (confirmAction === 'upgrade') {
            url = `/api/k8s/helm/releases/${encodeURIComponent(resource.name)}/upgrade?namespace=${encodeURIComponent(resource.namespace)}&version=${encodeURIComponent(upgradeVersion)}`;
          }
          break;

        default:
          throw new Error('Unknown resource type or action');
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error: ${errText}`);
      }

      await onActionComplete();
      closeConfirm();
      closeScaleDialog();
      closeUpgradeDialog();
      closeRollbackDialog();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {type === 'pod' && (
        <>
          <Tooltip title="Restart Pod">
            <IconButton color="primary" onClick={() => openConfirm('restart')} disabled={actionLoading}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Pod">
            <IconButton color="error" onClick={() => openConfirm('delete')} disabled={actionLoading}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      )}

      {type === 'deployment' && (
        <>
          <Tooltip title="Restart Deployment">
            <IconButton color="primary" onClick={() => openConfirm('restart')} disabled={actionLoading}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Deployment">
            <IconButton color="error" onClick={() => openConfirm('delete')} disabled={actionLoading}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Scale Deployment">
            <IconButton color="secondary" onClick={openScaleDialog} disabled={actionLoading}>
              <ScaleIcon />
            </IconButton>
          </Tooltip>
        </>
      )}

      {type === 'helm' && (
        <>
          <Tooltip title="Uninstall Helm Release">
            <IconButton color="error" onClick={() => openConfirm('uninstall')} disabled={actionLoading}>
              <UninstallIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rollback Helm Release">
            <IconButton color="warning" onClick={openRollbackDialog} disabled={actionLoading}>
              <RollbackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upgrade Helm Release">
            <IconButton color="primary" onClick={openUpgradeDialog} disabled={actionLoading}>
              <UpgradeIcon />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>Confirm {confirmAction}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {confirmAction} <strong>{resource.name}</strong> in namespace{' '}
            <strong>{resource.namespace}</strong>?
          </DialogContentText>
          {error && <DialogContentText color="error">{error}</DialogContentText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={performAction} color="error" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scale dialog */}
      <Dialog open={scaleDialogOpen} onClose={closeScaleDialog}>
        <DialogTitle>Scale Deployment</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Replicas"
            fullWidth
            value={scaleValue}
            onChange={(e) => setScaleValue(parseInt(e.target.value, 10))}
            inputProps={{ min: 1 }}
            disabled={actionLoading}
          />
          {error && <DialogContentText color="error">{error}</DialogContentText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeScaleDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={performAction} color="primary" disabled={actionLoading}>
            {actionLoading ? 'Scaling...' : 'Scale'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade dialog */}
      <Dialog open={upgradeDialogOpen} onClose={closeUpgradeDialog}>
        <DialogTitle>Upgrade Helm Release</DialogTitle>
        <DialogContent>
          <TextField
            label="Version"
            placeholder="Enter chart version"
            fullWidth
            value={upgradeVersion}
            onChange={(e) => setUpgradeVersion(e.target.value)}
            disabled={actionLoading}
          />
          {error && <DialogContentText color="error">{error}</DialogContentText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUpgradeDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmAction('upgrade');
              performAction();
            }}
            color="primary"
            disabled={actionLoading || !upgradeVersion.trim()}
          >
            {actionLoading ? 'Upgrading...' : 'Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback dialog */}
      <Dialog open={rollbackDialogOpen} onClose={closeRollbackDialog}>
        <DialogTitle>Rollback Helm Release</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Revision"
            placeholder="Enter revision number"
            fullWidth
            value={rollbackRevision}
            onChange={(e) => setRollbackRevision(e.target.value)}
            disabled={actionLoading}
            inputProps={{ min: 1 }}
          />
          {error && <DialogContentText color="error">{error}</DialogContentText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRollbackDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmAction('rollback');
              performAction();
            }}
            color="primary"
            disabled={actionLoading || !rollbackRevision.trim()}
          >
            {actionLoading ? 'Rolling back...' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActionButtons;
