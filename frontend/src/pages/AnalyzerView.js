import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, LinearProgress, Grid
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Storage as NodeIcon,
  Dns as PodIcon,
  Apps as DeploymentIcon,
  ListAlt as JobIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';

const MotionPaper = ({ children }) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(5px)',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      mb: 3
    }}>
      {children}
    </Paper>
  </motion.div>
);

const HealthSummary = () => {
  const [summary, setSummary] = useState({
    crashLoopPods: [],
    failedJobs: [],
    notReadyNodes: [],
    unhealthyDeployments: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const [podsRes, jobsRes, nodesRes, deploymentsRes] = await Promise.all([
          api.get('/api/k8s/pods?status=CrashLoopBackOff'),
          api.get('/api/k8s/jobs?status=failed'),
          api.get('/api/k8s/nodes?status=NotReady'),
          api.get('/api/k8s/deployments?status=unhealthy')
        ]);

        setSummary({
          crashLoopPods: podsRes.data,
          failedJobs: jobsRes.data,
          notReadyNodes: nodesRes.data,
          unhealthyDeployments: deploymentsRes.data,
          loading: false
        });
      } catch (err) {
        setSummary(prev => ({ ...prev, error: err.message, loading: false }));
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (summary.loading) return <LinearProgress sx={{ height: 2, borderRadius: 5 }} />;
  if (summary.error) return <Typography color="error">Error: {summary.error}</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="CrashLoop Pods"
            count={summary.crashLoopPods.length}
            icon={<PodIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Failed Jobs"
            count={summary.failedJobs.length}
            icon={<JobIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="NotReady Nodes"
            count={summary.notReadyNodes.length}
            icon={<NodeIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Unhealthy Deploys"
            count={summary.unhealthyDeployments.length}
            icon={<DeploymentIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Detailed Tables */}
      <MotionPaper>
        <Typography variant="h6" sx={{ p: 2, color: 'white' }}>
          <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          CrashLoopBackOff Pods
        </Typography>
        <ResourceTable
          resources={summary.crashLoopPods}
          columns={[
            { id: 'name', label: 'Pod Name' },
            { id: 'namespace', label: 'Namespace' },
            { id: 'status', label: 'Status', format: value => (
              <Chip label={value} color="error" icon={<ErrorIcon />} size="small" />
            )},
            { id: 'restarts', label: 'Restarts' }
          ]}
        />
      </MotionPaper>

      {/* Repeat similar blocks for Jobs/Nodes/Deployments */}
      <MotionPaper>
        <Typography variant="h6" sx={{ p: 2, color: 'white' }}>
          <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Unhealthy Deployments
        </Typography>
        <ResourceTable
          resources={summary.unhealthyDeployments}
          columns={[
            { id: 'name', label: 'Deployment' },
            { id: 'namespace', label: 'Namespace' },
            { id: 'available', label: 'Available', format: value => (
              <Chip 
                label={`${value.ready}/${value.replicas}`} 
                color={value.ready === value.replicas ? 'success' : 'error'}
                icon={value.ready === value.replicas ? <HealthyIcon /> : <ErrorIcon />}
              />
            )},
            { id: 'conditions', label: 'Issues', format: conditions => (
              conditions.map(c => (
                <Chip label={c} color="warning" size="small" sx={{ mr: 1 }} />
              ))
            )}
          ]}
        />
      </MotionPaper>
    </Box>
  );
};

// Reusable Components
const SummaryCard = ({ title, count, icon, color }) => (
  <Paper sx={{ 
    p: 2,
    backgroundColor: theme => theme.palette[color].dark,
    color: 'white',
    borderRadius: '12px'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {React.cloneElement(icon, { sx: { fontSize: 40, mr: 2 } })}
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="h4">{count}</Typography>
      </Box>
    </Box>
  </Paper>
);

const ResourceTable = ({ resources, columns }) => (
  <TableContainer>
    <Table>
      <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <TableRow>
          {columns.map(col => (
            <TableCell key={col.id} sx={{ color: 'white' }}>
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {resources.map(resource => (
          <TableRow key={resource.name}>
            {columns.map(col => (
              <TableCell key={`${resource.name}-${col.id}`}>
                {col.format ? col.format(resource[col.id]) : resource[col.id]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default HealthSummary;