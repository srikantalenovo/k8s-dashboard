// src/components/MotionPaper.js
import React from "react";
import { Paper } from "@mui/material";
import { motion } from "framer-motion";

const MotionPaper = motion(Paper);

const AnimatedPaper = ({ children, ...props }) => {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </MotionPaper>
  );
};

export default AnimatedPaper;
