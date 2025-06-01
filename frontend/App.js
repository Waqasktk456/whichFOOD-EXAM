import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import themeConfig from './theme';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HealthDashboardPage from './pages/HealthDashboardPage';
import MealLogPage from './pages/MealLogPage';
import RecommendationsPage from './pages/RecommendationsPage';

// Import components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Create MUI theme from our configuration
const theme = createTheme(themeConfig);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/health" element={
              <ProtectedRoute>
                <HealthDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/meals" element={
              <ProtectedRoute>
                <MealLogPage />
              </ProtectedRoute>
            } />
            <Route path="/recommendations" element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;
