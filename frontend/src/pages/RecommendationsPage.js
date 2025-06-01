import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, CardMedia, Button, Chip, Divider, CircularProgress, Alert, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../services/api'; // Import the configured axios instance
import { AuthContext } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
}));

const NutrientProgressBar = styled(Box)(({ theme, value, color }) => ({
  position: 'relative',
  height: '8px',
  width: '100%',
  backgroundColor: theme.palette?.grey[300] || '#e0e0e0', // Use theme palette
  borderRadius: '4px',
  marginTop: '4px',
  '&:before': {
    content: '""',
    position: 'absolute',
    height: '100%',
    width: `${Math.min(value, 100)}%`,
    backgroundColor: color || theme.palette?.primary?.main || '#1976d2',
    borderRadius: '4px',
  }
}));

const FoodCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: theme.borderRadius?.medium || 8,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows?.large || '0 8px 30px rgba(0,0,0,0.15)',
  },
}));

const RecommendationsPage = () => {
  const { token } = useContext(AuthContext);
  const [recommendationData, setRecommendationData] = useState({
    message: '',
    nutritionNeeds: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminD: 0 },
    currentIntake: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, vitaminD: 0 },
    recommendations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch recommendations data
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/meals/recommendations');
        setRecommendationData(response.data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err.response?.data?.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRecommendations();
    } else {
      setError('Not authenticated. Please log in.');
      setLoading(false);
    }
  }, [token]);

  // Calculate percentage of daily needs met
  const calculatePercentage = (current, target) => {
    if (!target || target === 0) return 0; // Avoid division by zero
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Determine color based on percentage
  const getColorForPercentage = (percentage) => {
    if (percentage < 50) return '#F44336'; // Red
    if (percentage < 80) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };

  // Helper to display nutrient value and target
  const renderNutrientProgress = (nutrientKey, label, unit) => {
    const current = recommendationData.currentIntake[nutrientKey] || 0;
    const target = recommendationData.nutritionNeeds[nutrientKey] || 0;
    const percentage = calculatePercentage(current, target);
    const color = getColorForPercentage(percentage);

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {current.toFixed(unit === 'mg' || unit === 'mcg' ? 0 : 1)}{unit} / {target.toFixed(unit === 'mg' || unit === 'mcg' ? 0 : 1)}{unit}
          </Typography>
        </Box>
        <NutrientProgressBar value={percentage} color={color} />
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Food Recommendations
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {!loading && !error && (
        <>
          <StyledPaper sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Nutritional Needs vs. Intake Today
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Macronutrients
                </Typography>
                {renderNutrientProgress('calories', 'Calories', 'kcal')}
                {renderNutrientProgress('protein', 'Protein', 'g')}
                {renderNutrientProgress('carbs', 'Carbohydrates', 'g')}
                {renderNutrientProgress('fat', 'Fat', 'g')}
                {renderNutrientProgress('fiber', 'Fiber', 'g')}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Micronutrients (Examples)
                </Typography>
                {renderNutrientProgress('calcium', 'Calcium', 'mg')}
                {renderNutrientProgress('iron', 'Iron', 'mg')}
                {renderNutrientProgress('vitaminC', 'Vitamin C', 'mg')}
                {renderNutrientProgress('vitaminD', 'Vitamin D', 'mcg')}
                {/* Add more micronutrients if available from backend */} 
              </Grid>
            </Grid>
          </StyledPaper>

          <Typography variant="h5" gutterBottom>
            Recommended Foods for You
          </Typography>
          <Typography variant="body1" paragraph>
            {recommendationData.message || 'Based on your nutritional needs and preferences, we recommend the following foods:'}
          </Typography>

          {recommendationData.recommendations.length > 0 ? (
            <Grid container spacing={3}>
              {recommendationData.recommendations.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item.recipe.uri || index}> {/* Use URI as key if available */}
                  <FoodCard>
                    <CardMedia
                      component="img"
                      height="160"
                      image={item.recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={item.recipe.label}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {item.recipe.label}
                      </Typography>

                      {item.recipe.dietLabels?.map(label => (
                        <Chip key={label} label={label} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                      {item.recipe.healthLabels?.slice(0, 3).map(label => ( // Show a few health labels
                        <Chip key={label} label={label} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}

                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                        ~{(item.recipe.calories / (item.recipe.yield || 1)).toFixed(0)} calories per serving
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" gutterBottom>
                        Why it's recommended:
                      </Typography>

                      <ul style={{ paddingLeft: '1.2rem', marginTop: 0, marginBottom: '1rem' }}>
                        {item.reasons?.map((reason, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">
                              {reason}
                            </Typography>
                          </li>
                        ))}
                        {/* Add nutrient highlights if needed */}
                        {item.recipe.totalNutrients?.PROCNT && (
                           <li><Typography variant="body2">Protein: {(item.recipe.totalNutrients.PROCNT.quantity / (item.recipe.yield || 1)).toFixed(1)}g/serving</Typography></li>
                        )}
                         {item.recipe.totalNutrients?.FIBTG && (
                           <li><Typography variant="body2">Fiber: {(item.recipe.totalNutrients.FIBTG.quantity / (item.recipe.yield || 1)).toFixed(1)}g/serving</Typography></li>
                        )}
                      </ul>

                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth
                        component={Link} // Make it a link
                        href={item.recipe.url} // Link to the recipe source
                        target="_blank" // Open in new tab
                        rel="noopener noreferrer"
                      >
                        View Recipe
                      </Button>
                    </CardContent>
                  </FoodCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 4 }}>
              No specific recommendations available at the moment.
            </Typography>
          )}
        </>
      )}
    </Container>
  );
};

export default RecommendationsPage;

