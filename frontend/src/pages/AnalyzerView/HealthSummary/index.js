// src/pages/AnalyzerView/HealthSummary/index.js
import React, { useEffect, useState } from "react";
import { fetchHealthSummary } from "../../../services/api";
import SummaryCard from "./SummaryCard";
import ResourceTable from "./ResourceTable";
import {
  Box,
  Grid,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const HealthSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchHealthSummary();
      setSummary(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch health summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
   // const interval = setInterval(() => loadData(), 60000); // Auto-refresh every 60s
    const interval = setInterval(() => loadData(), 1800000); // Auto-refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  if (loading && !summary) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress color="primary" />
        <Typography variant="h6" mt={2}>
          Loading cluster health data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Cluster Health Summary
        </Typography>
        <Tooltip title="Refresh Now">
          <IconButton onClick={loadData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        {summary &&
          Object.entries(summary).map(([key, value]) => (
            <Grid item xs={12} md={6} key={key}>
              <SummaryCard
                title={key}
                count={value?.length || 0}
                onClick={() => toggleExpand(key)}
              />
              {expanded === key && (
                <ResourceTable title={key} resources={value} />
              )}
            </Grid>
          ))}
      </Grid>

      {lastUpdated && (
        <Box mt={3} textAlign="right">
          <Typography variant="caption" color="textSecondary">
            Last updated at {lastUpdated}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default HealthSummary;
