import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button, MenuItem,
  Snackbar, Alert, CircularProgress, List, ListItem, ListItemText, IconButton,
  Divider, Tooltip, InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js'; // Renamed Tooltip to ChartTooltip to avoid conflict
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import api from '../utils/api'; // CONFIRMED: Using '../utils/api' based on other files
import { AuthContext } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

ChartJS.register(ArcElement, ChartTooltip, Legend); // Register the renamed Tooltip

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
}));

const FoodCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.small || '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const NUTRIENT_COLORS = {
  ENERC_KCAL: '#FF6384', // Calories
  PROCNT: '#36A2EB', // Protein
  FAT: '#FFCE56',    // Fats
  CHOCDF: '#4BC0C0',  // Carbs
  // Add more as needed
};

const MealLogPage = () => {
  const { token } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [measure, setMeasure] = useState('serving'); // Default measure
  const [mealType, setMealType] = useState('Breakfast');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loggedMeals, setLoggedMeals] = useState({});
  const [dailyNutrientSummary, setDailyNutrientSummary] = useState({
    ENERC_KCAL: 0,
    PROCNT: 0,
    FAT: 0,
    CHOCDF: 0,
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverBackgroundColor: []
    }]
  });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Current date

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchFood = useCallback(async () => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const response = await api.get(`/api/food/search?query=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSearchResults(response.data);
      setError(null);
    } catch (err) {
      console.error('Error searching food:', err);
      setError('Failed to fetch food items. Please try again.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchTerm, token]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFood();
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchFood]);

  const fetchLoggedMeals = useCallback(async () => {
    if (!token) {
      setError('User not authenticated. Please log in.');
      setLoadingMeals(false);
      return;
    }

    setLoadingMeals(true);
    setError(null);
    try {
      const response = await api.get(`/api/meals?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const meals = response.data;
      const groupedMeals = meals.reduce((acc, meal) => {
        const type = meal.mealType || 'Unknown';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(meal);
        return acc;
      }, {});
      setLoggedMeals(groupedMeals);

      // Calculate daily nutrient summary
      const summary = { ENERC_KCAL: 0, PROCNT: 0, FAT: 0, CHOCDF: 0 };
      meals.forEach(meal => {
        meal.foods.forEach(food => {
          summary.ENERC_KCAL += (food.nutrients?.ENERC_KCAL?.value || 0) * food.quantity;
          summary.PROCNT += (food.nutrients?.PROCNT?.value || 0) * food.quantity;
          summary.FAT += (food.nutrients?.FAT?.value || 0) * food.quantity;
          summary.CHOCDF += (food.nutrients?.CHOCDF?.value || 0) * food.quantity;
        });
      });
      setDailyNutrientSummary(summary);
    } catch (err) {
      console.error('Error fetching logged meals:', err);
      setError('Failed to load logged meals. Please try again.');
      setLoggedMeals({});
      setDailyNutrientSummary({ ENERC_KCAL: 0, PROCNT: 0, FAT: 0, CHOCDF: 0 }); // Reset on error
    } finally {
      setLoadingMeals(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchLoggedMeals();
  }, [fetchLoggedMeals]);

  // Update chart data whenever dailyNutrientSummary changes
  useEffect(() => {
    const labels = Object.keys(dailyNutrientSummary);
    const data = Object.values(dailyNutrientSummary);
    const backgroundColors = labels.map(label => NUTRIENT_COLORS[label] || '#CCCCCC'); // Default grey for unknown
    const hoverBackgroundColors = labels.map(label => NUTRIENT_COLORS[label] || '#CCCCCC');

    // Ensure data array has at least some values to avoid errors if all are zero
    // Chart.js `reduce` error often happens if the `data` array is empty or contains non-numbers
    const filteredData = data.filter(value => typeof value === 'number' && !isNaN(value) && value > 0);
    const filteredLabels = labels.filter((_, index) => typeof data[index] === 'number' && !isNaN(data[index]) && data[index] > 0);
    const filteredBackgroundColors = backgroundColors.filter((_, index) => typeof data[index] === 'number' && !isNaN(data[index]) && data[index] > 0);
    const filteredHoverBackgroundColors = hoverBackgroundColors.filter((_, index) => typeof data[index] === 'number' && !isNaN(data[index]) && data[index] > 0);

    setChartData({
      labels: filteredLabels,
      datasets: [{
        label: 'Nutrient Intake',
        data: filteredData,
        backgroundColor: filteredBackgroundColors,
        hoverBackgroundColor: filteredHoverBackgroundColors,
        borderWidth: 1, // Add border for better separation
      }],
    });
  }, [dailyNutrientSummary]);


  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    // Reset quantity and measure if it was an explicit choice
    setQuantity(1);
    // Attempt to set a default measure if available from the API response
    if (food.measures && food.measures.length > 0) {
      setMeasure(food.measures[0].label || 'serving');
    } else {
      setMeasure('serving'); // Fallback
    }
    setSearchResults([]); // Clear search results after selection
    setSearchTerm(''); // Clear search term as well
  };

  const handleLogMeal = async () => {
    if (!selectedFood || !quantity || !mealType || !measure) {
      showSnackbar('Please select a food, quantity, and meal type.', 'warning');
      return;
    }
    setLoadingLog(true);
    try {
      await api.post('/api/meals/log', {
        foodId: selectedFood.id, // Assuming selectedFood has an ID
        name: selectedFood.name,
        quantity: parseFloat(quantity),
        measure: measure,
        mealType: mealType,
        date: selectedDate, // Use the selected date
        nutrients: selectedFood.nutrients, // Pass full nutrients
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showSnackbar('Meal logged successfully!', 'success');
      setSelectedFood(null); // Clear selection after logging
      setQuantity(1);
      fetchLoggedMeals(); // Re-fetch meals to update the log and summary
    } catch (err) {
      console.error('Error logging meal:', err);
      let errorMessage = 'Failed to log meal.';
      if (err.response) {
        errorMessage = `Error: ${err.response.status} - ${err.response.data.message || 'Server error'}`;
      } else if (err.request) {
        errorMessage = 'Network error: No response from server.';
      } else {
        errorMessage = `Request error: ${err.message}`;
      }
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoadingLog(false);
    }
  };

  const handleDeleteMealItem = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal item?')) {
      return;
    }
    try {
      await api.delete(`/api/meals/${mealId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showSnackbar('Meal item deleted successfully!', 'success');
      fetchLoggedMeals(); // Re-fetch meals to update the log and summary
    } catch (err) {
      console.error('Error deleting meal item:', err);
      let errorMessage = 'Failed to delete meal item.';
      if (err.response) {
        errorMessage = `Error: ${err.response.status} - ${err.response.data.message || 'Server error'}`;
      } else {
        errorMessage = `Request error: ${err.message}`;
      }
      showSnackbar(errorMessage, 'error');
    }
  };


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Meal Log
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: Log a Meal */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Log a Meal
            </Typography>

            <TextField
              fullWidth
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Search Food"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., apple, chicken breast"
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {loadingSearch ? <CircularProgress size={20} /> : <SearchIcon />}
                  </InputAdornment>
                ),
              }}
            />

            {searchResults.length > 0 && (
              <Paper sx={{ maxHeight: 200, overflow: 'auto', width: '100%', mb: 2 }}>
                <List dense>
                  {searchResults.map((food) => (
                    <ListItem button key={food.id} onClick={() => handleFoodSelect(food)}>
                      <ListItemText primary={food.name} secondary={`${Math.round(food.nutrients.ENERC_KCAL || 0)} kcal`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {selectedFood && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Food: {selectedFood.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      inputProps={{ min: "0.1", step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Measure</InputLabel>
                      <Select
                        value={measure}
                        label="Measure"
                        onChange={(e) => setMeasure(e.target.value)}
                      >
                        {selectedFood.measures?.map((m) => (
                          <MenuItem key={m.uri} value={m.label}>
                            {m.label}
                          </MenuItem>
                        )) || <MenuItem value="serving">serving</MenuItem>}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Meal Type</InputLabel>
                      <Select
                        value={mealType}
                        label="Meal Type"
                        onChange={(e) => setMealType(e.target.value)}
                      >
                        {MEAL_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={handleLogMeal}
                  disabled={loadingLog}
                >
                  {loadingLog ? <CircularProgress size={24} /> : 'Log Meal'}
                </Button>
              </Box>
            )}
          </StyledPaper>
        </Grid>

        {/* Right Column: Daily Summary & Meal List */}
        <Grid item xs={12} md={6}>
          <SectionPaper>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Daily Nutrient Summary ({format(parseISO(selectedDate), 'MMM d, yyyy')})
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              {loadingMeals ? (
                <CircularProgress />
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : chartData.labels.length > 0 ? (
                <Box sx={{ width: '80%', height: '80%', maxWidth: 300, maxHeight: 300 }}>
                  <Pie
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 20,
                            padding: 15,
                            font: {
                              size: 14,
                            },
                          },
                        },
                        ChartTooltip: { // Use ChartTooltip
                          callbacks: {
                            label: function(context) {
                              let label = context.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed !== null) {
                                label += `${Math.round(context.parsed)} ${context.label === 'ENERC_KCAL' ? 'kcal' : 'g'}`;
                              }
                              return label;
                            }
                          }
                        },
                        title: {
                          display: false,
                        }
                      },
                    }}
                  />
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Log meals to see your daily nutrient summary.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Logged Meals
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
              {loadingMeals ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                  <CircularProgress />
                </Box>
              ) : Object.keys(loggedMeals).length > 0 ? (
                Object.keys(loggedMeals).map((mealType) => (
                  <Box key={mealType} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {mealType}
                    </Typography>
                    <List disablePadding>
                      {loggedMeals[mealType].map((meal) => (
                        <Box key={meal._id || meal.id} sx={{ mb: 1, border: '1px solid #f0f0f0', borderRadius: 1 }}>
                          <ListItem
                            secondaryAction={
                              <Tooltip title="Delete Meal Item">
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteMealItem(meal._id || meal.id)}>
                                  <RemoveCircleOutlineIcon color="error" />
                                </IconButton>
                              </Tooltip>
                            }
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body1" component="span" sx={{ fontWeight: 'medium' }}>
                                  {meal.foods.map(f => f.name).join(', ')}
                                </Typography>
                              }
                              secondary={`Total: ${Math.round(meal.foods.reduce((sum, f) => sum + (f.nutrients?.ENERC_KCAL?.value || 0) * f.quantity, 0))} kcal`}
                            />
                          </ListItem>
                          {meal.foods.map((food, index) => (
                            <ListItem key={index} dense sx={{ pl: 4, py: 0.2, width: '100%' }}>
                              <ListItemText
                                primary={`${food.quantity} ${food.measure} ${food.name}`}
                                secondary={`~${((food.nutrients?.ENERC_KCAL?.value || 0) * food.quantity).toFixed(0)} kcal`}
                                secondaryTypographyProps={{ fontSize: '0.8rem' }}
                              />
                            </ListItem>
                          ))}
                        </Box>
                      ))}
                    </List>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 2, width: '100%' }}>
                  No meals logged for this date.
                </Typography>
              )}
            </Box>
          </SectionPaper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MealLogPage;