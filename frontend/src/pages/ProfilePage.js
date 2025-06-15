import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Grid, TextField, Button, Avatar, InputAdornment, MenuItem, Snackbar, Alert, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import HeightIcon from '@mui/icons-material/Height';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmailIcon from '@mui/icons-material/Email';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  margin: '0 auto',
  border: `4px solid ${theme.palette.primary.main}`,
}));

const ProfilePage = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data);
        setEditedData({
          ...response.data,
          bloodPressureSystolic: response.data.bloodPressure?.systolic || '',
          bloodPressureDiastolic: response.data.bloodPressure?.diastolic || '',
          bloodGlucose: response.data.bloodGlucose || '',
        });
      } catch (error) {
        setSnackbarMessage(error.response?.data?.message || 'Failed to fetch profile data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate, logout]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  const handleArrayChange = (e, field) => {
    const { value } = e.target;
    setEditedData({
      ...editedData,
      [field]: value.split(',').map(item => item.trim()).filter(item => item),
    });
  };

  const handleSave = async () => {
    try {
      const requestData = {
        ...editedData,
        bloodPressure: {
          systolic: editedData.bloodPressureSystolic ? Number(editedData.bloodPressureSystolic) : undefined,
          diastolic: editedData.bloodPressureDiastolic ? Number(editedData.bloodPressureDiastolic) : undefined,
        },
        bloodGlucose: editedData.bloodGlucose ? Number(editedData.bloodGlucose) : undefined,
      };
      delete requestData.bloodPressureSystolic;
      delete requestData.bloodPressureDiastolic;

      const response = await api.put('/users/profile', requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data);
      setEditedData({
        ...response.data,
        bloodPressureSystolic: response.data.bloodPressure?.systolic || '',
        bloodPressureDiastolic: response.data.bloodPressure?.diastolic || '',
        bloodGlucose: response.data.bloodGlucose || '',
      });
      setIsEditing(false);
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleCancel = () => {
    setEditedData({
      ...userData,
      bloodPressureSystolic: userData.bloodPressure?.systolic || '',
      bloodPressureDiastolic: userData.bloodPressure?.diastolic || '',
      bloodGlucose: userData.bloodGlucose || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">Loading...</Typography>
      </Container>
    );
  }

  if (!userData) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <ProfileAvatar src={userData.profilePicture || 'https://source.unsplash.com/random/200x200/?portrait'} alt={userData.name} />
              <Typography variant="h5" sx={{ mt: 2 }}>
                {userData.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {userData.email}
              </Typography>

              {!isEditing && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    startIcon={<ExitToAppIcon />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Health Metrics
            </Typography>

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                BMI
              </Typography>
              <Typography variant="h6">
                {userData.healthMetrics.bmi}
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                BMR
              </Typography>
              <Typography variant="h6">
                {userData.healthMetrics.bmr} calories/day
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Daily Caloric Needs
              </Typography>
              <Typography variant="h6">
                {userData.healthMetrics.dailyCalories} calories/day
              </Typography>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={8}>
          <StyledPaper>
            {isEditing ? (
              <Box component="form">
                <Typography variant="h6" gutterBottom>
                  Edit Profile
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={editedData.name || ''}
                      onChange={handleChange}
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
                      fullWidth
                      label="Email"
                      name="email"
                      value={editedData.email || ''}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Age"
                      name="age"
                      type="number"
                      value={editedData.age || ''}
                      onChange={handleChange}
                      inputProps={{ min: 18, max: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Gender"
                      name="gender"
                      value={editedData.gender || ''}
                      onChange={handleChange}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Height (cm)"
                      name="height"
                      type="number"
                      value={editedData.height || ''}
                      onChange={handleChange}
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
                      fullWidth
                      label="Weight (kg)"
                      name="weight"
                      type="number"
                      value={editedData.weight || ''}
                      onChange={handleChange}
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
                      label="Systolic BP (mmHg)"
                      name="bloodPressureSystolic"
                      type="number"
                      value={editedData.bloodPressureSystolic || ''}
                      onChange={handleChange}
                      inputProps={{ min: 50, max: 250 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Diastolic BP (mmHg)"
                      name="bloodPressureDiastolic"
                      type="number"
                      value={editedData.bloodPressureDiastolic || ''}
                      onChange={handleChange}
                      inputProps={{ min: 30, max: 150 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Blood Glucose (mg/dL)"
                      name="bloodGlucose"
                      type="number"
                      value={editedData.bloodGlucose || ''}
                      onChange={handleChange}
                      inputProps={{ min: 20, max: 500 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Activity Level"
                      name="activityLevel"
                      value={editedData.activityLevel || ''}
                      onChange={handleChange}
                    >
                      <MenuItem value="sedentary">Sedentary</MenuItem>
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="moderate">Moderate</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="very_active">Very Active</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Target Weight (kg)"
                      name="targetWeight"
                      type="number"
                      value={editedData.targetWeight || ''}
                      onChange={handleChange}
                      inputProps={{ min: 30, max: 300 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Allergies (comma separated)"
                      value={editedData.allergies?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(e, 'allergies')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalDiningIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dietary Restrictions (comma separated)"
                      value={editedData.dietaryRestrictions?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(e, 'dietaryRestrictions')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalDiningIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Health Conditions (comma separated)"
                      value={editedData.healthConditions?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(e, 'healthConditions')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MedicalInformationIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Medications (comma separated)"
                      value={editedData.medications?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(e, 'medications')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MedicalInformationIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Age
                    </Typography>
                    <Typography variant="body1">
                      {userData.age} years
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Gender
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {userData.gender}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Height
                    </Typography>
                    <Typography variant="body1">
                      {userData.height} cm
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Weight
                    </Typography>
                    <Typography variant="body1">
                      {userData.weight} kg
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Blood Pressure
                    </Typography>
                    <Typography variant="body1">
                      {userData.bloodPressure?.systolic && userData.bloodPressure?.diastolic 
                        ? `${userData.bloodPressure.systolic}/${userData.bloodPressure.diastolic} mmHg`
                        : 'Not set'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Blood Glucose
                    </Typography>
                    <Typography variant="body1">
                      {userData.bloodGlucose ? `${userData.bloodGlucose} mg/dL` : 'Not set'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Activity Level
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {userData.activityLevel?.replace('_', ' ')}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target Weight
                    </Typography>
                    <Typography variant="body1">
                      {userData.targetWeight || 'Not set'} kg
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Dietary Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Allergies
                    </Typography>
                    <Typography variant="body1">
                      {userData.allergies?.length > 0 
                        ? userData.allergies.join(', ')
                        : 'None'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dietary Restrictions
                    </Typography>
                    <Typography variant="body1">
                      {userData.dietaryRestrictions?.length > 0 
                        ? userData.dietaryRestrictions.join(', ')
                        : 'None'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Health Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Health Conditions
                    </Typography>
                    <Typography variant="body1">
                      {userData.healthConditions?.length > 0 
                        ? userData.healthConditions.join(', ')
                        : 'None'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Medications
                    </Typography>
                    <Typography variant="body1">
                      {userData.medications?.length > 0 
                        ? userData.medications.join(', ')
                        : 'None'}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </StyledPaper>
        </Grid>
      </Grid>

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

export default ProfilePage;
