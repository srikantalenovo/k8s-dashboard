import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import ResourceTable from "./ResourceTable";
import { fetchHealthSummary } from "../../../services/api";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  CircularProgress,
  Collapse,
} from "@mui/material";

const HealthSummary = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchHealthSummary();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch health summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
        <Typography variant="body2" mt={2} sx={{ color: 'white', fontWeight: 'bold' }}>
          Loading cluster health data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600} sx={{ color: 'white', fontWeight: 'bold' }}>
          Cluster Health Summary
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="textSecondary" sx={{ color: 'white', fontWeight: 'bold' }}>
            Last updated: {formatTime(lastUpdated)}
          </Typography>
          <IconButton onClick={fetchData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="CrashLoopBackOff Pods"
            count={healthData?.crashLoopBackOffPods?.length || 0}
            icon="Pod"
            gradient="linear-gradient(to right, #ff758c, #ff7eb3)"
            onClick={() => toggleSection("pods")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Failed Jobs"
            count={healthData?.failedJobs?.length || 0}
            icon="Apps"
            gradient="linear-gradient(to right, #4158d0, #c850c0)"
            onClick={() => toggleSection("jobs")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="NotReady Nodes"
            count={healthData?.notReadyNodes?.length || 0}
            icon="Node"
            gradient="linear-gradient(to right, #00c6ff, #0072ff)"
            onClick={() => toggleSection("nodes")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Unhealthy Deployments"
            count={healthData?.unhealthyDeployments?.length || 0}
            icon="Apps"
            gradient="linear-gradient(to right, #f7971e, #ffd200)"
            onClick={() => toggleSection("deployments")}
          />
        </Grid>
      </Grid>

      <Collapse in={expandedSection === "pods"} timeout="auto" unmountOnExit>
        <ResourceTable title="CrashLoopBackOff Pods" data={healthData?.crashLoopBackOffPods || []} />
      </Collapse>

      <Collapse in={expandedSection === "jobs"} timeout="auto" unmountOnExit>
        <ResourceTable title="Failed Jobs" data={healthData?.failedJobs || []} />
      </Collapse>

      <Collapse in={expandedSection === "nodes"} timeout="auto" unmountOnExit>
        <ResourceTable title="NotReady Nodes" data={healthData?.notReadyNodes || []} />
      </Collapse>

      <Collapse in={expandedSection === "deployments"} timeout="auto" unmountOnExit>
        <ResourceTable title="Unhealthy Deployments" data={healthData?.unhealthyDeployments || []} />
      </Collapse>
    </Box>
  );
};

export default HealthSummary;
