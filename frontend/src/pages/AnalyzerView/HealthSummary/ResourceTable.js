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
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          mb: 1,
          fontFamily: "Roboto, sans-serif",
        }}
      >
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
        sx={{ backgroundColor: "#fff", borderRadius: 1 }}
        InputProps={{
          sx: {
            fontFamily: "Roboto, sans-serif",
          },
        }}
      />

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflow: "auto",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background:
                  "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
              }}
            >
              {data.length > 0 &&
                Object.keys(data[0]).map((key) => (
                  <TableCell
                    key={key}
                    sx={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontFamily: "Roboto, sans-serif",
                    }}
                  >
                    {key}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  transition: "background 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f9f9f9",
                  },
                }}
              >
                {Object.values(row).map((val, i) => (
                  <TableCell
                    key={i}
                    sx={{
                      fontFamily: "Roboto, sans-serif",
                      fontSize: "0.95rem",
                    }}
                  >
                    {String(val)}
                  </TableCell>
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
