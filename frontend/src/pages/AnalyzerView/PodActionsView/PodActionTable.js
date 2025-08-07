// src/views/PodActionsView/PodActionTable.js
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { styled } from "@mui/material/styles";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  fontSize: "0.9rem",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: 6,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export default function PodActionTable({
  title,
  data = [],
  loading = false,
  onDelete,
  onRestart,
  onViewLogs,
}) {
  const safeData = Array.isArray(data) ? data : [];

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    item: null,
  });

  const handleConfirm = (type, item) => {
    setConfirmDialog({ open: true, type, item });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, type: null, item: null });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === "delete" && onDelete) {
      onDelete(confirmDialog.item);
    }
    if (confirmDialog.type === "restart" && onRestart) {
      onRestart(confirmDialog.item);
    }
    handleConfirmClose();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 3,
        background: "linear-gradient(145deg, #ffffff, #f3f4f6)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={32} />
        </Box>
      ) : safeData.length === 0 ? (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography variant="body2" color="text.secondary">
            No resources found.
          </Typography>
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell>Name</StyledTableCell>
                <StyledTableCell>Namespace</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeData.map((item, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <TableCell>{item.name || "—"}</TableCell>
                  <TableCell>{item.namespace || "—"}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color:
                          item.status?.toLowerCase() === "running"
                            ? "success.main"
                            : "error.main",
                      }}
                    >
                      {item.status || "Unknown"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {/* View Logs */}
                    {onViewLogs && (
                      <Tooltip title="View Logs">
                        <StyledIconButton
                          color="primary"
                          onClick={() => onViewLogs(item)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}

                    {/* Restart */}
                    {onRestart && (
                      <Tooltip title="Restart">
                        <StyledIconButton
                          color="warning"
                          onClick={() => handleConfirm("restart", item)}
                        >
                          <RestartAltIcon fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}

                    {/* Delete */}
                    {onDelete && (
                      <Tooltip title="Delete">
                        <StyledIconButton
                          color="error"
                          onClick={() => handleConfirm("delete", item)}
                        >
                          <DeleteIcon fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm {confirmDialog.type === "delete" ? "Delete" : "Restart"} Action
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {confirmDialog.type === "delete" ? "delete" : "restart"}{" "}
            <strong>{confirmDialog.item?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button
            variant="contained"
            color={
              confirmDialog.type === "delete" ? "error" : "warning"
            }
            onClick={handleConfirmAction}
          >
            {confirmDialog.type === "delete" ? "Delete" : "Restart"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
