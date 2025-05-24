"use client";

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
let theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)', // Using Geist Sans from the existing layout
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '1.125rem',
    },
    button: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'none', // Keep button text as is
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingTop: '10px',
          paddingBottom: '10px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#3e52a3',
          },
        },
      },
      defaultProps: {
        size: 'large', // Larger buttons by default
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: '1.75rem', // Larger icons
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flatter AppBar
        },
      },
    },
  },
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export default theme;
