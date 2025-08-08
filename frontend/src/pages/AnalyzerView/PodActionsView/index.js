// PodActionsView/index.js
import React from 'react';
import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import PodActionTable from './PodActionTable';
import DeploymentActionTable from './DeploymentActionTable';
import HelmActionTable from './HelmActionTable';

const PodActionsView = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 3,
          background: 'linear-gradient(90deg, #4cafef, #3f51b5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Pod Actions
      </Typography>

      <Grid container spacing={3}>
        {/* Pods Section */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              boxShadow: 4,
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: '#1e293b',
                }}
              >
                Pods
              </Typography>
              <PodActionTable />
            </CardContent>
          </Card>
        </Grid>

        {/* Deployments Section */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              boxShadow: 4,
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: '#1e293b',
                }}
              >
                Deployments
              </Typography>
              <DeploymentActionTable />
            </CardContent>
          </Card>
        </Grid>

        {/* Helm Releases Section */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              boxShadow: 4,
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: '#1e293b',
                }}
              >
                Helm Releases
              </Typography>
              <HelmActionTable />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PodActionsView;
