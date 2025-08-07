// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // change to 'dark' for dark mode
    primary: {
      main: '#13e1b1ff', // blue
    },
    secondary: {
      main: '#08ac7dff', // purple
    },
    background: {
      default: '#f4f6f8', // page background
      paper: '#ffffff',   // card/paper background
    },
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: `'Poppins', sans-serif`,
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
