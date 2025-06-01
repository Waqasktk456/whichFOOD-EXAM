const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addHealthMetric,
  getHealthMetrics,
  getHealthMetricById,
  updateHealthMetric,
  deleteHealthMetric,
  getHealthMetricsStats
} = require('../controllers/healthController');

// All routes are protected
router.route('/')
  .post(protect, addHealthMetric)
  .get(protect, getHealthMetrics);

router.route('/stats')
  .get(protect, getHealthMetricsStats);

router.route('/:id')
  .get(protect, getHealthMetricById)
  .put(protect, updateHealthMetric)
  .delete(protect, deleteHealthMetric);

module.exports = router;
