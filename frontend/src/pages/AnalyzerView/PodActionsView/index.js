import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, Card, CardContent, CircularProgress } from "@mui/material";
import PodActionTable from "../PodActionsView/PodActionTable";

export default function PodActionsView() {
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data from backend
  const fetchPodActionsData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/k8s/analyzer/health-summary");
      if (!res.ok) throw new Error("Failed to fetch pod actions data");

      const data = await res.json();

      setPods(data.errorPods || []);
      setDeployments(data.errorDeployments || []);
      setHelmReleases(data.helmReleases || []);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodActionsData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center" color="error.main">
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Pod Actions
      </Typography>

      <Grid container spacing={3}>
        {/* Pods Card */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4, background: "linear-gradient(135deg, #fceabb, #f8b500)" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Pods
              </Typography>
              <PodActionTable
                type="pod"
                data={pods}
                onActionComplete={fetchPodActionsData}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Deployments Card */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4, background: "linear-gradient(135deg, #a8edea, #fed6e3)" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Deployments
              </Typography>
              <PodActionTable
                type="deployment"
                data={deployments}
                onActionComplete={fetchPodActionsData}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Helm Releases Card */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 4, background: "linear-gradient(135deg, #d4fc79, #96e6a1)" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Helm Releases
              </Typography>
              <PodActionTable
                type="helm"
                data={helmReleases}
                onActionComplete={fetchPodActionsData}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
