// src/theme.js
import { createTheme } from '@mui/material/styles';

export const tokens = (mode) => ({
  // Your color tokens here
  primary: {
    100: "#d0d1d5",
    200: "#a1a4ab",
    // ...
  }
});

export const theme = createTheme({
  // Your theme settings
});

export default theme;