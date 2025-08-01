import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const K8sResourceTable = ({ resources }) => {
  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'namespace', headerName: 'Namespace', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'age', headerName: 'Age', width: 100 },
    { field: 'cpu', headerName: 'CPU', width: 100 },
    { field: 'memory', headerName: 'Memory', width: 100 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box sx={{ height: 400, width: '100%', mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Kubernetes Resources
        </Typography>
        <DataGrid
          rows={resources || []}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
        />
      </Box>
    </motion.div>
  );
};

export default K8sResourceTable;
