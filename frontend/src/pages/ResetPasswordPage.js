
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, TextField, Button, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
}));

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setSnackbarMessage('Please enter and confirm your new password');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters long');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/users/reset-password/${token}`, { password });
      setSnackbarMessage('Password reset successfully! Redirecting to login...');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ py: 8 }}>
      <StyledPaper>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Reset Password
          </Button>
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

export default ResetPasswordPage;
