import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Paper, Grid, TextField, Button, MenuItem, Snackbar, Alert, CircularProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

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
  padding: theme.spacing(2),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
  height: '400px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const MealLogPage = () => {
  const { token } = useContext(AuthContext);
  const [mealType, setMealType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [mealLogs, setMealLogs] = useState([]);
  const [nutritionSummary, setNutritionSummary] = useState({
    currentIntake: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    nutritionNeeds: { calories: 2000, protein: 75, carbs: 275, fat: 65, fiber: 30 },
  });

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingSummary(true);
      try {
        const logsResponse = await api.get('/meals');
        setMealLogs(logsResponse.data || []);

        const summaryResponse = await api.get('/meals/stats');
        setNutritionSummary(summaryResponse.data || nutritionSummary);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setSnackbarMessage(error.response?.data?.message || 'Failed to load meal data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoadingSummary(false);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token]);

  const chartData = {
    labels: ['Protein (g)', 'Carbs (g)', 'Fat (g)'],
    datasets: [
      {
        data: [
          nutritionSummary.currentIntake.protein || 0,
          nutritionSummary.currentIntake.carbs || 0,
          nutritionSummary.currentIntake.fat || 0,
        ],
        backgroundColor: ['#0088FE', '#00C49F', '#FFBB28'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Macronutrient Distribution (grams)' },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) label += context.parsed.toFixed(1) + 'g';
            return label;
          }
        }
      }
    },
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSnackbarMessage('Please enter a food item to search');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setLoadingSearch(true);
    setSearchResults([]);
    try {
      const response = await api.get('/food/search', {
        params: { query: searchQuery }
      });
      console.log("Search Response:", response.data);
      setSearchResults(response.data.foods || []);
      if (!response.data.foods || response.data.foods.length === 0) {
        setSnackbarMessage('No foods found. Try a different search term.');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to search foods');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddFood = (food) => {
    const defaultMeasure = food.measures.find(m => m.label.toLowerCase() === 'serving') || food.measures[0];
    if (!defaultMeasure) {
      setSnackbarMessage(`Could not find a default measure for ${food.name}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setSelectedFoods([...selectedFoods, {
      foodId: food.id,
      name: food.name,
      quantity: 1,
      measureURI: defaultMeasure.uri,
      measureLabel: defaultMeasure.label,
      nutrients: food.nutrients,
      availableMeasures: food.measures
    }]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRemoveFood = (index) => {
    const newSelectedFoods = [...selectedFoods];
    newSelectedFoods.splice(index, 1);
    setSelectedFoods(newSelectedFoods);
  };

  const handleQuantityChange = (index, value) => {
    const newSelectedFoods = [...selectedFoods];
    newSelectedFoods[index].quantity = Math.max(0.1, Number(value));
    setSelectedFoods(newSelectedFoods);
  };

  const handleLogMeal = async () => {
    if (!mealType || selectedFoods.length === 0) {
      setSnackbarMessage('Please select a meal type and add at least one food item');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setLoadingLog(true);
    try {
      const payload = {
        mealType,
        foods: selectedFoods.map(food => {
          const quantity = food.quantity || 1;
          const adjustedNutrients = {
            ENERC_KCAL: (food.nutrients?.ENERC_KCAL || 0) * quantity,
            PROCNT: (food.nutrients?.PROCNT || 0) * quantity,
            CHOCDF: (food.nutrients?.CHOCDF || 0) * quantity,
            FAT: (food.nutrients?.FAT || 0) * quantity,
            FIBTG: (food.nutrients?.FIBTG || 0) * quantity,
          };
          return {
            foodId: food.foodId,
            name: food.name,
            quantity: quantity,
            measureURI: food.measureURI,
            measureLabel: food.measureLabel,
            nutrients: adjustedNutrients,
          };
        }),
        date: new Date().toISOString(),
      };

      const response = await api.post('/meals', payload);
      setMealLogs(prevLogs => {
        const newLog = response.data;
        const existingMeals = prevLogs.filter(log => log.mealType !== newLog.mealType);
        const sameTypeMeals = prevLogs.filter(log => log.mealType === newLog.mealType);
        return [newLog, ...sameTypeMeals, ...existingMeals];
      });

      const summaryResponse = await api.get('/meals/stats');
      setNutritionSummary(summaryResponse.data || nutritionSummary);

      setSelectedFoods([]);
      setMealType('');
      setSnackbarMessage('Meal logged successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Meal logging error:", error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to log meal');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingLog(false);
    }
  };

  const selectedFoodsTotalCalories = selectedFoods.reduce((sum, food) => {
    const caloriesPerUnit = food.nutrients?.ENERC_KCAL || 0;
    return sum + (caloriesPerUnit * food.quantity);
  }, 0);

  const groupedMeals = mealLogs.reduce((acc, meal) => {
    if (!acc[meal.mealType]) {
      acc[meal.mealType] = [];
    }
    acc[meal.mealType].push(meal);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Meal Logging
      </Typography>

      <Grid container spacing={3}>
        {/* Search Section */}
        <Grid item xs={12} sm={12} md={4} sx={{ flex: 1 }}>
          <SectionPaper>
            <Typography variant="h6" gutterBottom>
              Log a Meal
            </Typography>
            <Box sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
              <Box component="form" sx={{ mt: 1 }}>
                <TextField
                  select
                  label="Meal Type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                >
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                  <MenuItem value="snack">Snack</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', mt: 1, mb: 1 }}>
                  <TextField
                    label="Search Food"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    margin="dense"
                    onKeyPress={(e) => { if (e.key === 'Enter') { handleSearch(); e.preventDefault(); } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loadingSearch}
                    sx={{ ml: 1, mt: 1, height: 'fit-content' }}
                  >
                    {loadingSearch ? <CircularProgress size={24} /> : 'Search'}
                  </Button>
                </Box>

                {searchResults.length > 0 && (
                  <Paper variant="outlined" sx={{ mt: 1, maxHeight: 150, overflowY: 'auto', p: 1 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ pl: 1 }}>
                      Search Results
                    </Typography>
                    <List dense sx={{ width: '100%' }}>
                      {searchResults.map((food) => (
                        <ListItem
                          key={food.id}
                          secondaryAction={
                            <IconButton edge="end" aria-label="add" onClick={() => handleAddFood(food)}>
                              <AddCircleOutlineIcon color="primary" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={food.name}
                            secondary={`${food.nutrients?.ENERC_KCAL?.toFixed(0) || 0} kcal | P:${food.nutrients?.PROCNT?.toFixed(1) || 0}g | C:${food.nutrients?.CHOCDF?.toFixed(1) || 0}g | F:${food.nutrients?.FAT?.toFixed(1) || 0}g`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {selectedFoods.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Foods for {mealType || 'Meal'}
                    </Typography>
                    {selectedFoods.map((food, index) => (
                      <FoodCard key={`${food.foodId}-${index}`}>
                        <Box sx={{ flexGrow: 1, mr: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{food.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {((food.nutrients?.ENERC_KCAL || 0) * food.quantity).toFixed(0)} kcal | P: {((food.nutrients?.PROCNT || 0) * food.quantity).toFixed(1)}g | C: {((food.nutrients?.CHOCDF || 0) * food.quantity).toFixed(1)}g | F: {((food.nutrients?.FAT || 0) * food.quantity).toFixed(1)}g
                          </Typography>
                        </Box>
                        <TextField
                          type="number"
                          label="Qty"
                          size="small"
                          value={food.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
                          sx={{ width: 100, mx: 1 }} // Increased width from 70 to 100
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFood(index)}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </FoodCard>
                    ))}

                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        Total: {selectedFoodsTotalCalories.toFixed(0)} kcal
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogMeal}
                        disabled={loadingLog || !mealType}
                      >
                        {loadingLog ? <CircularProgress size={24} /> : 'Log Meal'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </SectionPaper>
        </Grid>

        {/* Today's Nutrition Summary */}
        <Grid item xs={12} sm={12} md={4} sx={{ flex: 1 }}>
          <SectionPaper>
            <Typography variant="h6" gutterBottom>
              Today's Nutrition Summary
            </Typography>
            <Box sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
              {loadingSummary ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: '50%' }} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">
                      Total Calories: {nutritionSummary.currentIntake.calories?.toFixed(0) || 0} kcal
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      Goal: {nutritionSummary.nutritionNeeds.calories?.toFixed(0) || 2000} kcal
                    </Typography>
                  </Box>

                  <Box sx={{ height: 150, position: 'relative', mb: 2 }}>
                    <Pie options={chartOptions} data={chartData} />
                  </Box>

                  <Grid container spacing={1}>
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Protein</Typography>
                      <Typography variant="h6">{nutritionSummary.currentIntake.protein?.toFixed(1) || 0}g</Typography>
                      <Typography variant="caption" color="text.secondary">Goal: {nutritionSummary.nutritionNeeds.protein?.toFixed(0) || 75}g</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Carbs</Typography>
                      <Typography variant="h6">{nutritionSummary.currentIntake.carbs?.toFixed(1) || 0}g</Typography>
                      <Typography variant="caption" color="text.secondary">Goal: {nutritionSummary.nutritionNeeds.carbs?.toFixed(0) || 275}g</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Fat</Typography>
                      <Typography variant="h6">{nutritionSummary.currentIntake.fat?.toFixed(1) || 0}g</Typography>
                      <Typography variant="caption" color="text.secondary">Goal: {nutritionSummary.nutritionNeeds.fat?.toFixed(0) || 65}g</Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </SectionPaper>
        </Grid>

        {/* Today's Meals */}
        <Grid item xs={12} sm={12} md={4} sx={{ flex: 1 }}>
          <SectionPaper>
            <Typography variant="h6" gutterBottom>
              Today's Meals
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', width: '100%' }}>
              {loadingSummary ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: '50%' }} />
              ) : Object.keys(groupedMeals).length > 0 ? (
                Object.entries(groupedMeals).map(([mealType, meals]) => (
                  <Box key={mealType} sx={{ mb: 2, width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Typography>
                    <List dense sx={{ width: '100%' }}>
                      {meals.map((meal) => (
                        <Box key={meal._id} sx={{ mb: 1, width: '100%' }}>
                          <ListItem disablePadding sx={{ pb: 0.5, width: '100%' }}>
                            <ListItemText
                              secondary={`Logged at ${new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ~${(meal.totalNutrients?.ENERC_KCAL?.quantity || meal.totalNutrients?.ENERC_KCAL?.value || 0).toFixed(0)} kcal`}
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
                  No meals logged today.
                </Typography>
              )}
            </Box>
          </SectionPaper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default MealLogPage;