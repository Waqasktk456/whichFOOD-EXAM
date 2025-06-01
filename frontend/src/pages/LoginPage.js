
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, TextField, Button, Avatar, InputAdornment,Grid , Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.colors?.primary?.main || '#1976d2',
}));

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setSnackbarMessage('Please enter both email and password');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Make API call to login
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password,
      });

      // Store user data and token in context
      login(response.data, response.data.token);

      // Show success message
      setSnackbarMessage('Login successful! Redirecting...');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Clear form and errors
      setEmail('');
      setPassword('');
      setError('');

      // Redirect to profile page
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      // Handle API errors
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      setSnackbarMessage(error.response?.data?.message || 'Login failed. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <StyledPaper>
        <StyledAvatar>
          <LockOutlinedIcon />
        </StyledAvatar>
        <Typography component="h1" variant="h5">
          Sign in to WhichFood
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, width: '100%' }}>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>

          <Grid container>
            <Grid item xs>
              <Button variant="text" size="small">
                Forgot password?
              </Button>
            </Grid>
            <Grid item>
              <Button variant="text" size="small" href="/register">
                Don't have an account? Sign Up
              </Button>
            </Grid>
          </Grid>
        </Box>
      </StyledPaper>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginPage;
