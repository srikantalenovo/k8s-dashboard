import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Typography,
  TextField,
  Box,
} from "@mui/material";

const ResourceTable = ({ title, data }) => {
  const [search, setSearch] = useState("");

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <TextField
        label="Search"
        variant="outlined"
        size="small"
        fullWidth
        margin="normal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              {data.length > 0 &&
                Object.keys(data[0]).map((key) => (
                  <TableCell key={key} sx={{ fontWeight: "bold" }}>
                    {key}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={index} hover>
                {Object.values(row).map((val, i) => (
                  <TableCell key={i}>{String(val)}</TableCell>
                ))}
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No matching results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResourceTable;
