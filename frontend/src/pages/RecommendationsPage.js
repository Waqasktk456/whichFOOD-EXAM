import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, CardMedia, Button, Chip, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
}));

const NutritionChart = ({ data }) => {
  // Simple bar chart representation
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {data.map((item, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{item.name}</Typography>
            <Typography variant="body2">{item.current} / {item.goal} {item.unit}</Typography>
          </Box>
          <Box sx={{ width: '100%', height: 10, bgcolor: 'grey.300', borderRadius: 5, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                width: `${Math.min(100, (item.current / item.goal) * 100)}%`, 
                height: '100%', 
                bgcolor: item.current > item.goal ? 'warning.main' : 'primary.main',
                borderRadius: 5
              }} 
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const RecommendationsPage = () => {
  const { token } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [nutritionalContext, setNutritionalContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mealType, setMealType] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let url = '/meals/recommendations';
        if (mealType) {
          url += `?mealType=${mealType}`;
        }

        const { data } = await api.get(url);
        
        if (data.success && data.recommendations) {
          setRecommendations(data.recommendations);
          setNutritionalContext(data.nutritionalContext);
        } else {
          setError('Failed to load recommendations');
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Failed to fetch recommendations'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRecommendations();
    }
  }, [token, mealType]);

  const handleMealTypeChange = (event) => {
    setMealType(event.target.value);
  };

  const handleLogMeal = async (food) => {
    try {
      setSelectedFood(food);
      setLogSuccess(false);
      
      const mealData = {
        mealType: mealType || 'snack', // Default to snack if not specified
        foods: [
          {
            foodId: food.id,
            name: food.name,
            quantity: 1,
            measureLabel: "100g",
            nutrients: food.nutrients
          }
        ],
        date: new Date().toISOString(),
        notes: `Added from recommendations: ${food.recommendationReason}`
      };

      await api.post('/meals', mealData);
      setLogSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setLogSuccess(false);
        setSelectedFood(null);
      }, 3000);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to log meal'
      );
    }
  };

  const renderNutritionalContext = () => {
    if (!nutritionalContext) return null;

    const { calorieGoal, proteinGoal, fatGoal, carbGoal, fiberGoal, currentIntake, primaryNutrient } = nutritionalContext;
    
    const nutritionData = [
      { name: 'Calories', goal: calorieGoal, current: currentIntake.calories, unit: 'kcal' },
      { name: 'Protein', goal: proteinGoal, current: currentIntake.protein, unit: 'g' },
      { name: 'Fat', goal: fatGoal, current: currentIntake.fat, unit: 'g' },
      { name: 'Carbs', goal: carbGoal, current: currentIntake.carbs, unit: 'g' },
      { name: 'Fiber', goal: fiberGoal, current: currentIntake.fiber, unit: 'g' }
    ];

    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Nutritional Profile
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Daily Goals vs. Current Intake
            </Typography>
            <Box sx={{ height: 300 }}>
              <NutritionChart data={nutritionData} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Recommendation Focus: <Chip 
                label={primaryNutrient.replace('-', ' ')} 
                color="primary" 
                sx={{ textTransform: 'capitalize' }} 
              />
            </Typography>
            <Typography variant="body2" paragraph>
              Based on your health profile and recent meal history, we're focusing on foods that help you maintain a balanced diet
              {primaryNutrient.includes('protein') && ' with special attention to your protein intake'}
              {primaryNutrient.includes('fat') && ' with special attention to your fat intake'}
              {primaryNutrient.includes('carb') && ' with special attention to your carbohydrate intake'}.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Daily Targets:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Calories: {calorieGoal} kcal</Typography>
                  <Typography variant="body2">Protein: {proteinGoal} g</Typography>
                  <Typography variant="body2">Fat: {fatGoal} g</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Carbs: {carbGoal} g</Typography>
                  <Typography variant="body2">Fiber: {fiberGoal} g</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <LocalDiningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Personalized Food Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Based on your health profile, goals, and recent meal history, we've curated these food suggestions to help you meet your nutritional needs.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="meal-type-label">Filter by Meal Type</InputLabel>
            <Select
              labelId="meal-type-label"
              id="meal-type"
              value={mealType}
              onChange={handleMealTypeChange}
              label="Filter by Meal Type"
            >
              <MenuItem value="">All Meals</MenuItem>
              <MenuItem value="breakfast">Breakfast</MenuItem>
              <MenuItem value="lunch">Lunch</MenuItem>
              <MenuItem value="dinner">Dinner</MenuItem>
              <MenuItem value="snack">Snack</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {renderNutritionalContext()}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : (
        <>
          {logSuccess && selectedFood && (
            <Alert severity="success" sx={{ mb: 4 }}>
              Successfully logged {selectedFood.name} to your meal log!
            </Alert>
          )}
          
          {recommendations.length === 0 ? (
            <Alert severity="info">
              No recommendations available. Try adjusting your filters or check back later.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {recommendations.map((food) => (
                <Grid item xs={12} sm={6} md={4} key={food.id}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <RestaurantIcon sx={{ fontSize: 60, color: 'white' }} />
                    </CardMedia>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {food.name}
                      </Typography>
                      {food.brand && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {food.brand}
                        </Typography>
                      )}
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Nutritional Value (per 100g):
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Calories: {Math.round(food.nutrients.ENERC_KCAL)} kcal
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Protein: {Math.round(food.nutrients.PROCNT)} g
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Fat: {Math.round(food.nutrients.FAT)} g
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Carbs: {Math.round(food.nutrients.CHOCDF)} g
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Chip 
                          size="small" 
                          icon={<FitnessCenterIcon />} 
                          label={food.recommendationReason} 
                          color="secondary" 
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth
                        onClick={() => handleLogMeal(food)}
                        disabled={selectedFood && selectedFood.id === food.id && logSuccess}
                      >
                        {selectedFood && selectedFood.id === food.id && logSuccess ? 'Logged!' : 'Log Meal'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default RecommendationsPage;
