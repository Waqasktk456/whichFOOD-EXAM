import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AddMeasurementModal from './AddMeasurementModal'; // Import the modal component

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.medium || '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
}));

const MetricCard = styled(Paper)(({ theme, metricColor }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.borderRadius?.medium || 8,
  boxShadow: theme.shadows?.small || '0 2px 8px rgba(0,0,0,0.1)',
  borderLeft: `4px solid ${metricColor || theme.palette?.primary?.main || '#1976d2'}`,
  marginBottom: theme.spacing(2),
}));

const HealthDashboardPage = () => {
  const { token } = useContext(AuthContext);
  const [healthStats, setHealthStats] = useState({
    blood_pressure: null,
    blood_glucose: null,
    weight: null,
  });
  const [selectedMetric, setSelectedMetric] = useState('blood_pressure');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Function to fetch stats for a single metric type
  const fetchStats = useCallback(async (metricType) => {
    try {
      const response = await api.get('/health/stats', {
        params: { type: metricType, period: 'month' } // Fetch last month's data
      });
      return response.data;
    } catch (err) {
      console.error(`Error fetching ${metricType} stats:`, err);
      setError((prevError) => prevError + ` Failed to load ${metricType} data. ${err.response?.data?.message || ''}`);
      return null;
    }
  }, []); // No dependencies as api instance is stable

  // Function to load stats for all metrics
  const loadAllStats = useCallback(async () => {
    setLoading(true);
    setError(''); // Clear previous errors before fetching
    const bpStats = await fetchStats('blood_pressure');
    const glucoseStats = await fetchStats('blood_glucose');
    const weightStats = await fetchStats('weight');

    setHealthStats({
      blood_pressure: bpStats,
      blood_glucose: glucoseStats,
      weight: weightStats,
    });
    setLoading(false);
  }, [fetchStats]); // Depends on fetchStats

  // Initial data load
  useEffect(() => {
    if (token) {
      loadAllStats();
    } else {
      setError('Not authenticated. Please log in.');
      setLoading(false);
    }
  }, [token, loadAllStats]); // Load when token changes or loadAllStats function is available

  // Prepare chart data when selected metric or stats change
  useEffect(() => {
    const stats = healthStats[selectedMetric];
    if (!stats || !stats.dataPoints || stats.dataPoints.length === 0) {
      setChartData(null);
      return;
    }

    if (selectedMetric === 'blood_pressure') {
      setChartData({
        labels: stats.dataPoints.map(item => new Date(item.timestamp)),
        datasets: [
          {
            label: 'Systolic',
            data: stats.dataPoints.map(item => item.value.systolic),
            borderColor: '#E91E63',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
            tension: 0.3,
          },
          {
            label: 'Diastolic',
            data: stats.dataPoints.map(item => item.value.diastolic),
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            tension: 0.3,
          },
        ],
      });
    } else {
      setChartData({
        labels: stats.dataPoints.map(item => new Date(item.timestamp)),
        datasets: [
          {
            label: selectedMetric === 'blood_glucose' ? 'Blood Glucose (mg/dL)' : 'Weight (kg)',
            data: stats.dataPoints.map(item => item.value),
            borderColor: selectedMetric === 'blood_glucose' ? '#9C27B0' : '#2196F3',
            backgroundColor: selectedMetric === 'blood_glucose' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)',
            tension: 0.3,
          },
        ],
      });
    }
  }, [selectedMetric, healthStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `${selectedMetric === 'blood_pressure' ? 'Blood Pressure' : selectedMetric === 'blood_glucose' ? 'Blood Glucose' : 'Weight'} Trend (Last Month)` },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'PPp',
          displayFormats: { day: 'MMM d' }
        },
        title: { display: true, text: 'Date' }
      },
      y: {
        beginAtZero: false,
        title: { display: true, text: selectedMetric === 'blood_pressure' ? 'mmHg' : selectedMetric === 'blood_glucose' ? 'mg/dL' : 'kg' }
      },
    },
  };

  const getLatestMetricValue = (metricType) => {
    const stats = healthStats[metricType];
    if (!stats || !stats.latest) return 'N/A';
    if (metricType === 'blood_pressure') {
      return `${stats.latest.systolic}/${stats.latest.diastolic} mmHg`;
    } else if (metricType === 'blood_glucose') {
      return `${stats.latest} mg/dL`;
    } else if (metricType === 'weight') {
      return `${stats.latest} kg`;
    }
    return 'N/A';
  };

  const getMetricColor = (metricType) => {
    switch (metricType) {
      case 'blood_pressure': return '#E91E63';
      case 'blood_glucose': return '#9C27B0';
      case 'weight': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const getTrendAnalysisText = () => {
    const stats = healthStats[selectedMetric];
    if (!stats || stats.count < 2) return 'Not enough data for trend analysis.';
    let analysis = `Trend: ${stats.trend}. `;
    if (selectedMetric === 'blood_pressure') {
      analysis += `Average: ${stats.average.systolic.toFixed(1)}/${stats.average.diastolic.toFixed(1)} mmHg. Range: ${stats.min.systolic}-${stats.max.systolic} / ${stats.min.diastolic}-${stats.max.diastolic} mmHg.`;
    } else {
      const unit = selectedMetric === 'blood_glucose' ? 'mg/dL' : 'kg';
      analysis += `Average: ${stats.average.toFixed(1)} ${unit}. Range: ${stats.min}-${stats.max} ${unit}.`;
    }
    return analysis;
  };

  // --- Modal Handlers ---
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleMeasurementAdded = () => {
    setSnackbarMessage('Measurement added successfully!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    loadAllStats(); // Refresh the dashboard data
  };
  // --- End Modal Handlers ---

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health Dashboard
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
        <Grid container spacing={3}>
          {/* Health Metrics Summary */}
          <Grid item xs={12} md={4}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Latest Health Metrics
              </Typography>

              <MetricCard metricColor={getMetricColor('blood_pressure')}>
                <Typography variant="subtitle1">Blood Pressure</Typography>
                <Typography variant="h5">{getLatestMetricValue('blood_pressure')}</Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedMetric('blood_pressure')}
                  sx={{ mt: 1 }}
                  disabled={!healthStats.blood_pressure || healthStats.blood_pressure.count === 0}
                >
                  View Trend
                </Button>
              </MetricCard>

              <MetricCard metricColor={getMetricColor('blood_glucose')}>
                <Typography variant="subtitle1">Blood Glucose</Typography>
                <Typography variant="h5">{getLatestMetricValue('blood_glucose')}</Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedMetric('blood_glucose')}
                  sx={{ mt: 1 }}
                  disabled={!healthStats.blood_glucose || healthStats.blood_glucose.count === 0}
                >
                  View Trend
                </Button>
              </MetricCard>

              <MetricCard metricColor={getMetricColor('weight')}>
                <Typography variant="subtitle1">Weight</Typography>
                <Typography variant="h5">{getLatestMetricValue('weight')}</Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedMetric('weight')}
                  sx={{ mt: 1 }}
                  disabled={!healthStats.weight || healthStats.weight.count === 0}
                >
                  View Trend
                </Button>
              </MetricCard>

              {/* --- Updated Button to Open Modal --- */}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleOpenModal} // Open the modal on click
                >
                  Add New Measurement
                </Button>
              </Box>
              {/* --- End Updated Button --- */}
            </StyledPaper>
          </Grid>

          {/* Health Trend Chart */}
          <Grid item xs={12} md={8}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Health Trends
              </Typography>

              {chartData ? (
                <Box sx={{ height: 350, position: 'relative' }}>
                  <Line options={chartOptions} data={chartData} />
                </Box>
              ) : (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                  {healthStats[selectedMetric] ? 'No data available for the selected period.' : 'Select a metric to view trend.'}
                </Typography>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Analysis (Last Month)
                </Typography>
                <Typography variant="body2">
                  {getTrendAnalysisText()}
                </Typography>
              </Box>
            </StyledPaper>
          </Grid>

          {/* Health Recommendations (Static) */}
          <Grid item xs={12}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                General Health Recommendations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle1" color="primary">
                      Diet Suggestions
                    </Typography>
                    <Typography variant="body2">
                      Consider increasing your intake of potassium-rich foods like bananas and spinach to help maintain healthy blood pressure.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle1" color="primary">
                      Activity Recommendations
                    </Typography>
                    <Typography variant="body2">
                      Adding 30 minutes of moderate cardio exercise 3-4 times per week could help improve your overall health metrics.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle1" color="primary">
                      Next Check-ups
                    </Typography>
                    <Typography variant="body2">
                      Consider measuring your cholesterol levels to get a more complete picture of your cardiovascular health.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>
        </Grid>
      )}

      {/* --- Render the Modal --- */}
      <AddMeasurementModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onMeasurementAdded={handleMeasurementAdded}
      />
      {/* --- End Render the Modal --- */}

      {/* Snackbar for notifications */}
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

export default HealthDashboardPage;

