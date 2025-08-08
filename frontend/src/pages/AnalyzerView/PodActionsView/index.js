import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, CircularProgress } from "@mui/material";
import PodActionTable from "./PodActionTable";
import HelmActionTable from "./HelmActionTable";
import DeploymentActionTable from "./DeploymentActionTable";

export default function PodActionsView() {
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [podsRes, deploysRes, helmRes] = await Promise.all([
        fetch("/api/pod-actions/pods").then((res) => res.json()),
        fetch("/api/pod-actions/deployments").then((res) => res.json()),
        fetch("/api/pod-actions/helm").then((res) => res.json()),
      ]);

      setPods(podsRes || []);
      setDeployments(deploysRes || []);
      setHelmReleases(helmRes || []);
    } catch (err) {
      console.error("Error fetching pod actions data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Pod Actions
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pods</Typography>
              <PodActionTable pods={pods} fetchPods={fetchData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Deployments</Typography>
              <DeploymentActionTable deployments={deployments} fetchDeployments={fetchData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Helm Releases</Typography>
              <HelmActionTable releases={helmReleases} fetchHelm={fetchData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
