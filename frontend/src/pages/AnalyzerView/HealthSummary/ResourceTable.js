// src/pages/AnalyzerView/HealthSummary/ResourceTable.js
import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Chip,
} from "@mui/material";

const ResourceTable = ({ title, resources }) => {
  const [search, setSearch] = useState("");

  const filtered = resources?.filter((res) =>
    JSON.stringify(res).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        {title} Details
      </Typography>
      <TextField
        label="Search"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ px: 2, pb: 2 }}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Table size="small">
        <TableHead>
          <TableRow>
            {Object.keys(filtered?.[0] || {}).map((key) => (
              <TableCell key={key} sx={{ fontWeight: "bold" }}>
                {key}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered?.map((item, idx) => (
            <TableRow key={idx}>
              {Object.entries(item).map(([key, val], i) => (
                <TableCell key={i}>
                  {typeof val === "string" && val.toLowerCase().includes("fail") ? (
                    <Chip label={val} color="error" size="small" />
                  ) : typeof val === "string" && val.toLowerCase().includes("ready") ? (
                    <Chip label={val} color="success" size="small" />
                  ) : (
                    val?.toString()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResourceTable;
