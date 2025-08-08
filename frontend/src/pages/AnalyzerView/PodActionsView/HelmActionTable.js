import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Paper
} from "@mui/material";

export default function HelmActionTable({ releases = [], fetchHelm }) {
  const handleUninstall = async (release) => {
    if (window.confirm(`Uninstall Helm release ${release.name}?`)) {
      await fetch(`/api/pod-actions/helm/${release.name}`, { method: "DELETE" });
      fetchHelm();
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Namespace</TableCell>
            <TableCell>Revision</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {releases.length > 0 ? (
            releases.map((rel, idx) => (
              <TableRow key={idx}>
                <TableCell>{rel.name}</TableCell>
                <TableCell>{rel.namespace}</TableCell>
                <TableCell>{rel.revision}</TableCell>
                <TableCell>{rel.updated}</TableCell>
                <TableCell>{rel.status}</TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => handleUninstall(rel)}>Uninstall</Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">No Helm releases found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
