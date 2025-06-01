// Color palette for WhichFood application
const theme = {
  colors: {
    // Primary colors
    primary: {
      main: '#4CAF50', // Green - represents health and nutrition
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#FFFFFF'
    },
    // Secondary colors
    secondary: {
      main: '#FF9800', // Orange - represents energy and vitality
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#000000'
    },
    // Accent colors
    accent: {
      blue: '#2196F3', // For water intake and hydration
      purple: '#9C27B0', // For sleep and recovery
      red: '#F44336', // For alerts and warnings
      teal: '#009688' // For achievements and goals
    },
    // Neutral colors
    neutral: {
      white: '#FFFFFF',
      lightGrey: '#F5F5F5',
      grey: '#9E9E9E',
      darkGrey: '#616161',
      black: '#212121'
    },
    // Background colors
    background: {
      default: '#FFFFFF',
      paper: '#F9F9F9',
      light: '#F5F7FA'
    },
    // Text colors
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9E9E9E',
      hint: '#BDBDBD'
    },
    // Status colors
    status: {
      success: '#4CAF50',
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336'
    },
    // Chart colors
    chart: {
      protein: '#0088FE', // Blue for protein
      carbs: '#00C49F',   // Teal for carbohydrates
      fat: '#FFBB28',     // Yellow for fat
      fiber: '#FF8042'    // Orange for fiber
    },
    // Health metric colors
    healthMetrics: {
      bloodPressure: '#E91E63', // Pink for blood pressure
      bloodGlucose: '#9C27B0',  // Purple for blood glucose
      cholesterol: '#FF9800',   // Orange for cholesterol
      heartRate: '#F44336',     // Red for heart rate
      weight: '#2196F3'         // Blue for weight
    }
  },
  // Typography
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700
  },
  // Spacing
  spacing: (factor) => `${8 * factor}px`,
  // Breakpoints
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px'
  },
  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 8px rgba(0,0,0,0.12)',
    large: '0 8px 16px rgba(0,0,0,0.14)'
  },
  // Border radius
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%'
  },
  // Transitions
  transitions: {
    short: '0.2s',
    medium: '0.3s',
    long: '0.5s'
  }
};

export default theme;
