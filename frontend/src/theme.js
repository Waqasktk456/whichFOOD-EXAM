// Color palette for WhichFood application
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  colors: {
    primary: {
      main: '#4CAF50',      // Green - representing health and nutrition
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FF9800',      // Orange - representing energy and vitality
      light: '#FFCC80',
      dark: '#F57C00',
      contrastText: '#000000'
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
      contrastText: '#FFFFFF'
    },
    warning: {
      main: '#FFC107',
      light: '#FFE082',
      dark: '#FFA000',
      contrastText: '#000000'
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#FFFFFF'
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#FFFFFF'
    },
    neutral: {
      darkGrey: '#333333',
      mediumGrey: '#666666',
      lightGrey: '#F5F5F5',
      white: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 600
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    circle: '50%'
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 8px rgba(0,0,0,0.1)',
    large: '0 8px 16px rgba(0,0,0,0.1)'
  }
});

export default theme;
