// src/components/MotionPaper.js
import { Paper } from "@mui/material";
import { motion } from "framer-motion";
import { styled } from "@mui/system";

// Create a motion-wrapped MUI Paper with custom animation and styling
const MotionPaper = styled(motion(Paper))({
  padding: "1rem",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
});

export default MotionPaper;
