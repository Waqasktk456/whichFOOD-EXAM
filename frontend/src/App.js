import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';

// Layout Components
import Header from './Header';
import Footer from './Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HealthDashboardPage from './pages/HealthDashboardPage';
import MealLogPage from './pages/MealLogPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ProfilePage from './pages/ProfilePage';


// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route 
                path="/health" 
                element={
                  <ProtectedRoute>
                    <HealthDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/meals" 
                element={
                  <ProtectedRoute>
                    <MealLogPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recommendations" 
                element={
                  <ProtectedRoute>
                    <RecommendationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
