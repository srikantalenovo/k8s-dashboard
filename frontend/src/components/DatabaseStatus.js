import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, CircularProgress, Paper, Chip } from '@mui/material';

const DatabaseStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const [healthRes, userRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/db/health`),
          user?.email && axios.get(`${process.env.REACT_APP_API_URL}/api/db/verify-user?email=${user.email}`)
        ]);
        
        setStatus({
          health: healthRes.data,
          user: userRes?.data
        });
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    checkDatabase();
  }, [user]);

  if (loading) return <CircularProgress />;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Database Connection Status
      </Typography>
      
      {error ? (
        <Chip label={`Error: ${error}`} color="error" />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label={`Status: ${status.health.status}`} 
              color={status.health.status === 'healthy' ? 'success' : 'error'} 
            />
            <Chip label={`Users: ${status.health.database.users}`} />
            <Chip label={`Test Query: ${status.health.database.testQuery ? '✅' : '❌'}`} />
          </Box>
          
          {status.user && (
            <Box>
              <Typography variant="subtitle1">Your Account Status:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Exists: ${status.user.exists ? '✅' : '❌'}`} />
                {status.user.user && (
                  <Chip label={`Created: ${new Date(status.user.user.createdAt).toLocaleString()}`} />
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default DatabaseStatus;
