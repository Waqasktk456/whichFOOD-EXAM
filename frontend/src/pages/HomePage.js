import React from 'react';
import { Container, Typography, Box, Paper, Grid, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RecommendIcon from '@mui/icons-material/Recommend';
import { Link } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: theme.borderRadius.medium,
  boxShadow: theme.shadows.medium,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows.large,
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  fontSize: '4rem',
  marginBottom: theme.spacing(2),
  color: theme.colors.primary.main,
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%)`,
  color: theme.colors.primary.contrastText,
  padding: theme.spacing(10, 0),
  borderRadius: theme.borderRadius.large,
  marginBottom: theme.spacing(6),
}));

const HomePage = () => {
  return (
    <Box>
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                WhichFood
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                Your Personal Nutrition & Health Assistant
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                Track your meals, monitor your health metrics, and get personalized food recommendations based on your unique profile and goals.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  component={Link}
                  to="/register"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  component={Link}
                  to="/login"
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
              <img 
                src="https://source.unsplash.com/random/600x400/?healthy-food" 
                alt="Healthy Food" 
                style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
              />
            </Grid>
          </Grid>
        </Container>
      </HeroSection>
      
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Key Features
        </Typography>
        <Typography variant="body1" align="center" paragraph sx={{ mb: 6 }}>
          WhichFood helps you make better food choices and maintain a healthier lifestyle.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <StyledPaper>
              <FeatureIcon>
                <RestaurantIcon fontSize="inherit" />
              </FeatureIcon>
              <Typography variant="h5" component="h3" gutterBottom>
                Meal Logging
              </Typography>
              <Typography variant="body1" paragraph>
                Easily log your meals and track your daily nutrition intake. Get insights into your eating habits and make informed decisions.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                to="/meals"
              >
                Log Your Meals
              </Button>
            </StyledPaper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StyledPaper>
              <FeatureIcon>
                <MonitorHeartIcon fontSize="inherit" />
              </FeatureIcon>
              <Typography variant="h5" component="h3" gutterBottom>
                Health Monitoring
              </Typography>
              <Typography variant="body1" paragraph>
                Track your health metrics like weight, blood pressure, and blood glucose. Visualize trends and monitor your progress over time.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                to="/health"
              >
                Monitor Health
              </Button>
            </StyledPaper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StyledPaper>
              <FeatureIcon>
                <RecommendIcon fontSize="inherit" />
              </FeatureIcon>
              <Typography variant="h5" component="h3" gutterBottom>
                Personalized Recommendations
              </Typography>
              <Typography variant="body1" paragraph>
                Get food recommendations tailored to your health profile, dietary preferences, and nutritional needs.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                to="/recommendations"
              >
                Get Recommendations
              </Button>
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>
      
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, borderRadius: '12px', bgcolor: 'background.light' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h2" gutterBottom>
                Your Health Journey Starts Here
              </Typography>
              <Typography variant="body1" paragraph>
                WhichFood is more than just a meal tracker. It's your personal health assistant that helps you understand your body's needs and make better food choices.
              </Typography>
              <Typography variant="body1" paragraph>
                With our comprehensive health monitoring tools and personalized recommendations, you'll be empowered to take control of your nutrition and overall wellbeing.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                component={Link}
                to="/register"
                sx={{ mt: 2 }}
              >
                Join WhichFood Today
              </Button>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
              <img 
                src="https://source.unsplash.com/random/600x400/?healthy-lifestyle" 
                alt="Healthy Lifestyle" 
                style={{ maxWidth: '100%', borderRadius: '12px' }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default HomePage;
