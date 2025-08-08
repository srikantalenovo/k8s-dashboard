// src/theme.js
import { createTheme } from '@mui/material/styles';

export const tokens = (mode) => ({
  grey: {
    700: "#e0e0e0", // Make sure these values exist
    800: "#bdbdbd"
  },
  primary: {
    400: "#f0f0f0",
    600: "#d0d0d0"
  },
  blueAccent: {
    700: "#1976d2"
  }
});

export const theme = createTheme({
  // Your theme settings
});

export default theme;