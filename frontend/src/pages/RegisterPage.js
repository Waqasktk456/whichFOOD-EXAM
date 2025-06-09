import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // *** ADD THIS LINE ***
import { Container, Typography, Box, Paper, Grid, TextField, Button, Avatar, InputAdornment, MenuItem, Snackbar, Alert, FormControl, InputLabel, Select, FormHelperText } from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import HeightIcon from '@mui/icons-material/Height';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
// *** FIX 1: Import your configured 'api' instance ***
// REMOVE: import axios from 'axios';
import api from '../utils/api'; // Assuming api.js is in src/utils/

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

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    bloodGlucose: '',
    activityLevel: '',
    targetWeight: '',
    allergies: '',
    dietaryRestrictions: '',
  });

  const [errors, setErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate(); // *** ADD THIS LINE ***

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.age) newErrors.age = 'Age is required';
    else if (isNaN(formData.age) || formData.age < 18 || formData.age > 100) newErrors.age = 'Please enter a valid age between 18 and 100';

    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.height) newErrors.height = 'Height is required';
    else if (isNaN(formData.height) || formData.height < 100 || formData.height > 250) newErrors.height = 'Height must be between 100 and 250 cm';

    if (!formData.weight) newErrors.weight = 'Weight is required';
    else if (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300) newErrors.weight = 'Weight must be between 30 and 300 kg';

    if (formData.bloodPressureSystolic && (isNaN(formData.bloodPressureSystolic) || formData.bloodPressureSystolic < 50 || formData.bloodPressureSystolic > 250))
      newErrors.bloodPressureSystolic = 'Systolic must be between 50 and 250 mmHg';
    if (formData.bloodPressureDiastolic && (isNaN(formData.bloodPressureDiastolic) || formData.bloodPressureDiastolic < 30 || formData.bloodPressureDiastolic > 150))
      newErrors.bloodPressureDiastolic = 'Diastolic must be between 30 and 150 mmHg';
    if (formData.bloodGlucose && (isNaN(formData.bloodGlucose) || formData.bloodGlucose < 20 || formData.bloodGlucose > 500))
      newErrors.bloodGlucose = 'Blood glucose must be between 20 and 500 mg/dL';

    if (!formData.activityLevel) newErrors.activityLevel = 'Activity level is required';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const requestData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        activityLevel: formData.activityLevel,
        targetWeight: formData.targetWeight ? Number(formData.targetWeight) : null,
        allergies: formData.allergies ? formData.allergies.split(',').map(item => item.trim()).filter(Boolean) : [],
        dietaryRestrictions: formData.dietaryRestrictions ? formData.dietaryRestrictions.split(',').map(item => item.trim()).filter(Boolean) : [],
      };

      // Include bloodPressure if both systolic and diastolic are provided and valid
      const systolic = Number(formData.bloodPressureSystolic);
      const diastolic = Number(formData.bloodPressureDiastolic);
      if (!isNaN(systolic) && !isNaN(diastolic) && formData.bloodPressureSystolic && formData.bloodPressureDiastolic) {
        requestData.bloodPressure = { systolic, diastolic };
      }

      // Include bloodGlucose if provided and valid
      const glucose = Number(formData.bloodGlucose);
      if (!isNaN(glucose) && formData.bloodGlucose) {
        requestData.bloodGlucose = glucose;
      }

      console.log('Sending requestData:', JSON.stringify(requestData, null, 2));

      // *** FIX 2: Use your 'api' instance with the relative path ***
      // REMOVE: const response = await axios.post('http://localhost:5000/api/users', requestData);
      const response = await api.post('/api/users', requestData); // Corrected API call

      setSnackbarMessage('Registration successful! Redirecting to login...');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        bloodGlucose: '',
        activityLevel: '',
        targetWeight: '',
        allergies: '',
        dietaryRestrictions: '',
      });
      setErrors({});

      // *** FIX 3: Use navigate for client-side redirect ***
      setTimeout(() => {
        navigate('/login'); // Corrected redirect
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      setSnackbarMessage(error.response?.data?.message || 'Registration failed. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <StyledPaper>
        <StyledAvatar>
          <PersonAddIcon />
        </StyledAvatar>
        <Typography component="h1" variant="h5">
          Create Your WhichFood Account
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Account Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Health Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                required
                fullWidth
                id="age"
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={!!errors.age}
                helperText={errors.age}
                InputProps={{
                  inputProps: { min: 18, max: 100 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                required
                fullWidth
                id="height"
                label="Height (cm)"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                error={!!errors.height}
                helperText={errors.height}
                InputProps={{
                  inputProps: { min: 100, max: 250 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <HeightIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                required
                fullWidth
                id="weight"
                label="Weight (kg)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                error={!!errors.weight}
                helperText={errors.weight}
                InputProps={{
                  inputProps: { min: 30, max: 300 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <FitnessCenterIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                id="bloodPressureSystolic"
                label="Systolic BP (mmHg)"
                name="bloodPressureSystolic"
                type="number"
                value={formData.bloodPressureSystolic}
                onChange={handleChange}
                error={!!errors.bloodPressureSystolic}
                helperText={errors.bloodPressureSystolic}
                InputProps={{
                  inputProps: { min: 50, max: 250 },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                id="bloodPressureDiastolic"
                label="Diastolic BP (mmHg)"
                name="bloodPressureDiastolic"
                type="number"
                value={formData.bloodPressureDiastolic}
                onChange={handleChange}
                error={!!errors.bloodPressureDiastolic}
                helperText={errors.bloodPressureDiastolic}
                InputProps={{
                  inputProps: { min: 30, max: 150 },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                id="bloodGlucose"
                label="Blood Glucose (mg/dL)"
                name="bloodGlucose"
                type="number"
                value={formData.bloodGlucose}
                onChange={handleChange}
                error={!!errors.bloodGlucose}
                helperText={errors.bloodGlucose}
                InputProps={{
                  inputProps: { min: 20, max: 500 },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.activityLevel}>
                <InputLabel id="activity-level-label">Activity Level</InputLabel>
                <Select
                  labelId="activity-level-label"
                  id="activityLevel"
                  name="activityLevel"
                  value={formData.activityLevel}
                  label="Activity Level"
                  onChange={handleChange}
                >
                  <MenuItem value="sedentary">Sedentary (little or no exercise)</MenuItem>
                  <MenuItem value="light">Light (exercise 1-3 days/week)</MenuItem>
                  <MenuItem value="moderate">Moderate (exercise 3-5 days/week)</MenuItem>
                  <MenuItem value="active">Active (exercise 6-7 days/week)</MenuItem>
                  <MenuItem value="very_active">Very Active (hard exercise daily)</MenuItem>
                </Select>
                {errors.activityLevel && <FormHelperText>{errors.activityLevel}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="targetWeight"
                label="Target Weight (kg)"
                name="targetWeight"
                type="number"
                value={formData.targetWeight}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 30, max: 300 },
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Dietary Information (Optional)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="allergies"
                label="Allergies (comma separated)"
                name="allergies"
                placeholder="e.g., peanuts, shellfish, dairy"
                value={formData.allergies}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="dietaryRestrictions"
                label="Dietary Restrictions (comma separated)"
                name="dietaryRestrictions"
                placeholder="e.g., vegetarian, vegan, gluten-free"
                value={formData.dietaryRestrictions}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid item>
              {/* This Link is fine, it uses client-side routing */}
              <Button variant="text" size="small" href="/login">
                Already have an account? Sign in
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

export default RegisterPage;