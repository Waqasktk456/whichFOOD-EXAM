import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
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
import { startOfWeek, format, parseISO, addDays } from 'date-fns';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddMeasurementModal from './AddMeasurementModal';

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
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  height: '100%',
}));

const MetricCard = styled(Paper)(({ theme, metricColor }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderLeft: `4px solid ${metricColor}`,
  marginBottom: theme.spacing(2),
}));

const HealthDashboardPage = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [healthStats, setHealthStats] = useState({
    blood_pressure: null,
    blood_glucose: null,
    weight: null,
  });
  const [initialMetrics, setInitialMetrics] = useState({
    blood_pressure: null,
    blood_glucose: null,
    weight: null,
  });
  const [userProfile, setUserProfile] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      } );
      setUserProfile(response.data);
    } catch (err) {
      setError('Failed to load user profile.');
    }
  }, [token]);

  // Fetch stats for a single metric type
  const fetchStats = useCallback(async (metricType) => {
    try {
      const response = await api.get('/api/health/stats', {
        params: { type: metricType, period: 'month' },
        headers: { Authorization: `Bearer ${token}` },
      } );
      return response.data;
    } catch (err) {
      setError((prevError) => prevError ? `${prevError} Failed to load ${metricType} data. ` : `Failed to load ${metricType} data.`);
      return { type: metricType, count: 0, dataPoints: [], latest: null, average: null, min: null, max: null, trend: 'stable' };
    }
  }, [token]);

  // Fetch all metrics of a specific type (not just stats)
  const fetchAllMetrics = useCallback(async (metricType) => {
    try {
      const response = await api.get('/api/health', {
        params: { type: metricType },
        headers: { Authorization: `Bearer ${token}` },
      } );
      return response.data;
    } catch (err) {
      console.error(`Failed to load ${metricType} metrics:`, err);
      return [];
    }
  }, [token]);

  // Fetch initial metric value (earliest HealthMetric entry)
  const fetchInitialMetric = useCallback(async (metricType) => {
    try {
      const response = await api.get('/api/health', {
        params: { type: metricType },
        headers: { Authorization: `Bearer ${token}` },
      } );
      // Sort by timestamp ascending and take the first entry
      const earliestMetric = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
      return earliestMetric || null;
    } catch (err) {
      console.error(`Failed to load initial ${metricType}:`, err);
      return null;
    }
  }, [token]);

  // Load stats and initial metrics for all metrics
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');

    // Fetch stats
    const bpStats = await fetchStats('blood_pressure');
    const glucoseStats = await fetchStats('blood_glucose');
    const weightStats = await fetchStats('weight');

    // Fetch initial metrics
    const bpInitial = await fetchInitialMetric('blood_pressure');
    const glucoseInitial = await fetchInitialMetric('blood_glucose');
    const weightInitial = await fetchInitialMetric('weight');

    setHealthStats({
      blood_pressure: bpStats,
      blood_glucose: glucoseStats,
      weight: weightStats,
    });
    setInitialMetrics({
      blood_pressure: bpInitial,
      blood_glucose: glucoseInitial,
      weight: weightInitial,
    });
    setLoading(false);
  }, [fetchStats, fetchInitialMetric]);

  // Initial data load
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      loadAllData();
    }
  }, [token, fetchUserProfile, loadAllData]);

  // Refresh data every 30 seconds to catch new measurements
  useEffect(() => {
    if (!token) return;
    
    const intervalId = setInterval(() => {
      loadAllData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [token, loadAllData]);

  // Aggregate weight data by week
  const aggregateWeeklyWeightData = (dataPoints) => {
    const weeklyData = {};
    dataPoints.forEach((item) => {
      const date = parseISO(item.timestamp);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, count: 0, date: weekStart };
      }
      weeklyData[weekKey].total += item.value;
      weeklyData[weekKey].count += 1;
    });

    return Object.values(weeklyData)
      .map((week) => ({
        timestamp: week.date,
        value: week.total / week.count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  // Generate demo data for daily view (Monday-Wednesday)
  const generateDemoData = (metricType) => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    
    // Create data for Monday, Tuesday, Wednesday
    const demoData = [];
    
    for (let i = 0; i < 3; i++) {
      const day = addDays(monday, i);
      
      if (metricType === 'blood_pressure') {
        demoData.push({
          timestamp: day,
          value: {
            systolic: 120 - i * 2, // Slightly decreasing values
            diastolic: 80 - i * 1
          }
        });
      } else if (metricType === 'blood_glucose') {
        demoData.push({
          timestamp: day,
          value: 95 + i * 3 // Slightly increasing values
        });
      } else if (metricType === 'weight') {
        demoData.push({
          timestamp: day,
          value: 70 - i * 0.2 // Slightly decreasing values
        });
      }
    }
    
    return demoData;
  };

  // Prepare chart data
  useEffect(() => {
    const stats = healthStats[selectedMetric];
    
    // Check if we have real data points
    const hasRealData = stats && stats.dataPoints && stats.dataPoints.length > 0;
    
    if (!hasRealData) {
      // Generate demo data if no real data exists
      const demoDataPoints = generateDemoData(selectedMetric);
      
      if (selectedMetric === 'blood_pressure') {
        setChartData({
          labels: demoDataPoints.map((item) => item.timestamp),
          datasets: [
            {
              label: 'Systolic',
              data: demoDataPoints.map((item) => item.value?.systolic || 0),
              borderColor: '#E91E63',
              backgroundColor: 'rgba(233, 30, 99, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              fill: false,
              borderWidth: 3,
            },
            {
              label: 'Diastolic',
              data: demoDataPoints.map((item) => item.value?.diastolic || 0),
              borderColor: '#9C27B0',
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              fill: false,
              borderWidth: 3,
            },
          ],
        });
      } else {
        setChartData({
          labels: demoDataPoints.map((item) => item.timestamp),
          datasets: [
            {
              label: selectedMetric === 'blood_glucose' ? 'Blood Glucose (mg/dL)' : 'Weight (kg)',
              data: demoDataPoints.map((item) => item.value || 0),
              borderColor: selectedMetric === 'blood_glucose' ? '#9C27B0' : '#2196F3',
              backgroundColor: selectedMetric === 'blood_glucose' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              tension: 0.3,
              pointRadius: 5,
              fill: false,
              borderWidth: 3,
            },
          ],
        });
      }
      return;
    }

    // We have real data, process it
    let processedDataPoints = stats.dataPoints;

    if (selectedMetric === 'weight') {
      processedDataPoints = aggregateWeeklyWeightData(stats.dataPoints);
    }

    if (selectedMetric === 'blood_pressure') {
      setChartData({
        labels: processedDataPoints.map((item) => new Date(item.timestamp)),
        datasets: [
          {
            label: 'Systolic',
            data: processedDataPoints.map((item) => item.value?.systolic || 0),
            borderColor: '#E91E63',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
            tension: 0.3,
            pointRadius: 5,
            fill: false,
            borderWidth: 3,
          },
          {
            label: 'Diastolic',
            data: processedDataPoints.map((item) => item.value?.diastolic || 0),
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            tension: 0.3,
            pointRadius: 5,
            fill: false,
            borderWidth: 3,
          },
        ],
      });
    } else {
      setChartData({
        labels: processedDataPoints.map((item) => new Date(item.timestamp)),
        datasets: [
          {
            label: selectedMetric === 'blood_glucose' ? 'Blood Glucose (mg/dL)' : 'Weight (kg)',
            data: processedDataPoints.map((item) => item.value || 0),
            borderColor: selectedMetric === 'blood_glucose' ? '#9C27B0' : '#2196F3',
            backgroundColor: selectedMetric === 'blood_glucose' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)',
            tension: 0.3,
            pointRadius: 5,
            fill: false,
            borderWidth: 3,
          },
        ],
      });
    }
  }, [selectedMetric, healthStats]);

  const getChartOptions = () => {
    const isWeightMetric = selectedMetric === 'weight';
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: isWeightMetric ? 2 : 3, // Wider aspect ratio for weight
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 25,
            usePointStyle: true,
            font: {
              size: 16,
            },
          },
        },
        title: {
          display: true,
          text: `${
            selectedMetric === 'blood_pressure'
              ? 'Blood Pressure'
              : selectedMetric === 'blood_glucose'
              ? 'Blood Glucose'
              : 'Weight'
          } Trend`,
          font: {
            size: 20,
            weight: 'bold',
          },
          padding: {
            bottom: 25,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ccc',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += selectedMetric === 'blood_pressure' ? context.parsed.y.toFixed(0) : context.parsed.y.toFixed(1);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: isWeightMetric ? 'week' : 'day',
            tooltipFormat: isWeightMetric ? 'PP' : 'EEE, MMM d', // Show weekday for daily view
            displayFormats: {
              day: 'EEE', // Show weekday (Mon, Tue, Wed)
              week: 'MMM d', // Show month and day for weekly
            },
          },
          title: {
            display: true,
            text: isWeightMetric ? 'Week' : 'Day',
            font: {
              size: 18,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(0,0,0,0.1)',
          },
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: selectedMetric === 'blood_pressure' ? 'mmHg' : selectedMetric === 'blood_glucose' ? 'mg/dL' : 'kg',
            font: {
              size: 18,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(0,0,0,0.1)',
          },
        },
      },
      elements: {
        point: {
          radius: 5,
          hoverRadius: 7,
        },
        line: {
          borderWidth: 3,
          tension: 0.3, // Make lines smoother
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };
  };

  const getLatestMetricValue = (metricType) => {
    const stats = healthStats[metricType];
    if (!stats || !stats.latest) return 'N/A';
    if (metricType === 'blood_pressure') {
      return stats.latest.systolic && stats.latest.diastolic
        ? `${stats.latest.systolic}/${stats.latest.diastolic} mmHg`
        : 'N/A';
    }
    return metricType === 'blood_glucose' ? `${stats.latest.toFixed(1)} mg/dL` : `${stats.latest.toFixed(1)} kg`;
  };

  const getInitialMetricValue = (metricType) => {
    const initial = initialMetrics[metricType];
    if (!initial || !initial.value) return 'Not set';
    if (metricType === 'blood_pressure') {
      return initial.value.systolic && initial.value.diastolic
        ? `${initial.value.systolic}/${initial.value.diastolic} mmHg`
        : 'Not set';
    }
    return `${initial.value.toFixed(1)} ${metricType === 'blood_glucose' ? 'mg/dL' : 'kg'}`;
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
    if (!stats || stats.count < 1) return 'Showing demo data. Add measurements to see your actual health trends.';
    
    if (stats.count === 1) {
      return 'Only one measurement recorded. Add more measurements to see trends.';
    }
    
    let analysis = `Trend: ${stats.trend}. `;
    if (selectedMetric === 'blood_pressure') {
      analysis += `Average: ${stats.average?.systolic?.toFixed(1)}/${stats.average?.diastolic?.toFixed(1)} mmHg. `;
      analysis += `Range: ${stats.min?.systolic || 'N/A'}-${stats.max?.systolic || 'N/A'} / ${stats.min?.diastolic || 'N/A'}-${stats.max?.diastolic || 'N/A'} mmHg.`;
    } else {
      const unit = selectedMetric === 'blood_glucose' ? 'mg/dL' : 'kg';
      analysis += `Average: ${stats.average?.toFixed(1) || 'N/A'} ${unit}. `;
      analysis += `Range: ${stats.min?.toFixed(1) || 'N/A'}-${stats.max?.toFixed(1) || 'N/A'} ${unit}.`;
    }
    return analysis;
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleMeasurementAdded = () => {
    setSnackbarMessage('Measurement added successfully!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    loadAllData(); // Immediately reload data to show the new measurement
    fetchUserProfile();
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Health Dashboard
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Health Metrics
              </Typography>
              <MetricCard metricColor={getMetricColor('blood_pressure')}>
                <Typography variant="subtitle1">Blood Pressure</Typography>
                <Typography variant="body2" color="text.secondary">
                  Initial: {getInitialMetricValue('blood_pressure')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest: {getLatestMetricValue('blood_pressure')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => setSelectedMetric('blood_pressure')}
                >
                  View Trend
                </Button>
              </MetricCard>
              <MetricCard metricColor={getMetricColor('blood_glucose')}>
                <Typography variant="subtitle1">Blood Glucose</Typography>
                <Typography variant="body2" color="text.secondary">
                  Initial: {getInitialMetricValue('blood_glucose')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest: {getLatestMetricValue('blood_glucose')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => setSelectedMetric('blood_glucose')}
                >
                  View Trend
                </Button>
              </MetricCard>
              <MetricCard metricColor={getMetricColor('weight')}>
                <Typography variant="subtitle1">Weight</Typography>
                <Typography variant="body2" color="text.secondary">
                  Initial: {getInitialMetricValue('weight')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest: {getLatestMetricValue('weight')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => setSelectedMetric('weight')}
                >
                  View Trend
                </Button>
              </MetricCard>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleOpenModal}
              >
                Add Measurement
              </Button>
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={9}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                {selectedMetric === 'blood_pressure'
                  ? 'Blood Pressure Trend'
                  : selectedMetric === 'blood_glucose'
                  ? 'Blood Glucose Trend'
                  : 'Weight Trend'}
              </Typography>
              {chartData ? (
                <>
                  <Box sx={{
                    height: selectedMetric === 'weight' ? 400 : 350, // Taller for weight chart
                    width: '100%',
                    mb: 2,
                    position: 'relative',
                  }}>
                    <Line data={chartData} options={getChartOptions()} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTrendAnalysisText()}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No data available for {selectedMetric.replace('_', ' ')}. Add measurements to view trends.
                </Typography>
              )}
            </StyledPaper>
          </Grid>
        </Grid>
      )}

      <AddMeasurementModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onMeasurementAdded={handleMeasurementAdded}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HealthDashboardPage;
