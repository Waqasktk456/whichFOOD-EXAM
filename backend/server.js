
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Initialize Express
const app = express();

// Connect to Database
connectDB();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
// Middleware
app.use(express.json());

// Define Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
