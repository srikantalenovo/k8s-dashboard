// src/pages/AnalyzerView/HealthSummary/SummaryCard.js
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const statusColors = {
  CrashLoopBackOff: "#f44336",
  FailedJobs: "#ff9800",
  NotReadyNodes: "#3f51b5",
  UnhealthyDeployments: "#9c27b0",
};

const icons = {
  CrashLoopBackOff: <ErrorOutlineIcon />,
  FailedJobs: <WarningIcon />,
  NotReadyNodes: <ErrorOutlineIcon />,
  UnhealthyDeployments: <WarningIcon />,
};

const SummaryCard = ({ title, count, onClick }) => {
  const color = statusColors[title] || "#607d8b";
  const icon = icons[title] || <ErrorOutlineIcon />;

  return (
    <Card
      onClick={onClick}
      sx={{
        borderLeft: `6px solid ${color}`,
        cursor: "pointer",
        boxShadow: 3,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" color={color} fontWeight="bold">
              {count}
            </Typography>
          </Box>
          <Tooltip title={title}>{icon}</Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
