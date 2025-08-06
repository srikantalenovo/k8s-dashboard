import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import {
  Dns as NodeIcon,
  Apps as AppsIcon,
  Storage as PodIcon,
} from "@mui/icons-material";

const iconMap = {
  Node: <NodeIcon />,
  Apps: <AppsIcon />,
  Pod: <PodIcon />,
};

const SummaryCard = ({ title, count, icon, gradient, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        background: gradient,
        color: "#fff",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.03)",
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {count}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
            {iconMap[icon]}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
