const asyncHandler = require("express-async-handler");
const HealthMetric = require("../models/HealthMetric");
const User = require("../models/User"); // Assuming User model exists

// @desc    Add health metric
// @route   POST /api/health
// @access  Private
const addHealthMetric = asyncHandler(async (req, res) => {
  const { type, value, unit, notes, timestamp } = req.body;

  if (!type || value === undefined || !unit) {
    res.status(400);
    throw new Error("Please provide type, value, and unit");
  }

  // Create health metric, ensuring user association
  const healthMetric = await HealthMetric.create({
    user: req.user._id, // Use authenticated user ID
    type,
    value,
    unit,
    notes,
    timestamp: timestamp || new Date(), // Use provided timestamp or now
  });

  if (healthMetric) {
    // Check if within normal range (using model method)
    const isNormal = healthMetric.isWithinNormalRange ? healthMetric.isWithinNormalRange() : null;

    res.status(201).json({
      _id: healthMetric._id,
      type: healthMetric.type,
      value: healthMetric.value,
      unit: healthMetric.unit,
      timestamp: healthMetric.timestamp,
      notes: healthMetric.notes,
      isWithinNormalRange: isNormal,
    });
  } else {
    res.status(400);
    throw new Error("Invalid health metric data");
  }
});

// @desc    Get all health metrics for the logged-in user
// @route   GET /api/health
// @access  Private
const getHealthMetrics = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  const query = { user: req.user._id }; // Filter by authenticated user

  if (type) query.type = type;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const healthMetrics = await HealthMetric.find(query).sort({ timestamp: -1 });

  // Add normal range check to each metric
  const metricsWithRangeCheck = healthMetrics.map(metric => {
    const isNormal = metric.isWithinNormalRange ? metric.isWithinNormalRange() : null;
    return {
      _id: metric._id,
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp,
      notes: metric.notes,
      isWithinNormalRange: isNormal,
    };
  });

  res.json(metricsWithRangeCheck);
});

// @desc    Get a specific health metric by ID
// @route   GET /api/health/:id
// @access  Private
const getHealthMetricById = asyncHandler(async (req, res) => {
  const healthMetric = await HealthMetric.findById(req.params.id);

  // Verify the metric exists and belongs to the logged-in user
  if (healthMetric && healthMetric.user.toString() === req.user._id.toString()) {
    const isNormal = healthMetric.isWithinNormalRange ? healthMetric.isWithinNormalRange() : null;
    res.json({
      _id: healthMetric._id,
      type: healthMetric.type,
      value: healthMetric.value,
      unit: healthMetric.unit,
      timestamp: healthMetric.timestamp,
      notes: healthMetric.notes,
      isWithinNormalRange: isNormal,
    });
  } else {
    res.status(404);
    throw new Error("Health metric not found or access denied");
  }
});

// @desc    Update a health metric
// @route   PUT /api/health/:id
// @access  Private
const updateHealthMetric = asyncHandler(async (req, res) => {
  const healthMetric = await HealthMetric.findById(req.params.id);

  // Verify the metric exists and belongs to the logged-in user
  if (!healthMetric || healthMetric.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Health metric not found or access denied");
  }

  // Update fields provided in the request body
  healthMetric.type = req.body.type || healthMetric.type;
  healthMetric.value = req.body.value !== undefined ? req.body.value : healthMetric.value;
  healthMetric.unit = req.body.unit || healthMetric.unit;
  healthMetric.notes = req.body.notes !== undefined ? req.body.notes : healthMetric.notes;
  healthMetric.timestamp = req.body.timestamp || healthMetric.timestamp;

  const updatedHealthMetric = await healthMetric.save();
  const isNormal = updatedHealthMetric.isWithinNormalRange ? updatedHealthMetric.isWithinNormalRange() : null;

  res.json({
    _id: updatedHealthMetric._id,
    type: updatedHealthMetric.type,
    value: updatedHealthMetric.value,
    unit: updatedHealthMetric.unit,
    timestamp: updatedHealthMetric.timestamp,
    notes: updatedHealthMetric.notes,
    isWithinNormalRange: isNormal,
  });
});

// @desc    Delete a health metric
// @route   DELETE /api/health/:id
// @access  Private
const deleteHealthMetric = asyncHandler(async (req, res) => {
  const healthMetric = await HealthMetric.findById(req.params.id);

  // Verify the metric exists and belongs to the logged-in user
  if (healthMetric && healthMetric.user.toString() === req.user._id.toString()) {
    await HealthMetric.deleteOne({ _id: req.params.id }); // Use deleteOne
    res.json({ message: "Health metric removed" });
  } else {
    res.status(404);
    throw new Error("Health metric not found or access denied");
  }
});

// @desc    Get health metrics statistics for the logged-in user
// @route   GET /api/health/stats
// @access  Private
const getHealthMetricsStats = asyncHandler(async (req, res) => {
  const { type, period = "month" } = req.query; // Default period to month

  if (!type) {
    res.status(400);
    throw new Error("Please provide metric type (e.g., weight, blood_pressure)");
  }

  // Determine date range based on period
  let startDate = new Date();
  const endDate = new Date(); // Today
  switch (period.toLowerCase()) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default: // Default to month
      startDate.setMonth(startDate.getMonth() - 1);
  }
  startDate.setHours(0, 0, 0, 0); // Start of the day

  // Get metrics for the specified type and period for the logged-in user
  const metrics = await HealthMetric.find({
    user: req.user._id, // Filter by authenticated user
    type,
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 }); // Sort chronologically for trend calculation

  // Calculate statistics
  let stats = {
    type: type,
    period: period,
    count: metrics.length,
    latest: null,
    average: null,
    min: null,
    max: null,
    trend: "stable", // Default trend
    dataPoints: [], // For chart rendering
  };

  if (metrics.length > 0) {
    stats.latest = metrics[metrics.length - 1].value;
    stats.dataPoints = metrics.map(m => ({
        timestamp: m.timestamp,
        value: m.value,
        notes: m.notes
    }));

    // Handle blood pressure separately for stats calculation
    if (type === "blood_pressure") {
      let systolicSum = 0, diastolicSum = 0;
      let systolicMin = Infinity, systolicMax = -Infinity;
      let diastolicMin = Infinity, diastolicMax = -Infinity;

      metrics.forEach(metric => {
        systolicSum += metric.value.systolic;
        diastolicSum += metric.value.diastolic;
        systolicMin = Math.min(systolicMin, metric.value.systolic);
        systolicMax = Math.max(systolicMax, metric.value.systolic);
        diastolicMin = Math.min(diastolicMin, metric.value.diastolic);
        diastolicMax = Math.max(diastolicMax, metric.value.diastolic);
      });

      stats.average = {
        systolic: systolicSum / metrics.length,
        diastolic: diastolicSum / metrics.length,
      };
      stats.min = { systolic: systolicMin, diastolic: diastolicMin };
      stats.max = { systolic: systolicMax, diastolic: diastolicMax };

    } else {
      // For other numeric metric types
      let sum = 0;
      let min = Infinity, max = -Infinity;

      metrics.forEach(metric => {
        sum += metric.value;
        min = Math.min(min, metric.value);
        max = Math.max(max, metric.value);
      });

      stats.average = sum / metrics.length;
      stats.min = min;
      stats.max = max;
    }

    // Calculate trend (simple check: compare first and last)
    if (metrics.length > 1) {
        const firstValue = (type === "blood_pressure") ? metrics[0].value.systolic : metrics[0].value;
        const lastValue = (type === "blood_pressure") ? metrics[metrics.length - 1].value.systolic : metrics[metrics.length - 1].value;
        // Add a threshold to avoid minor fluctuations being called a trend
        const threshold = (stats.max - stats.min) * 0.1; // 10% of range
        if (lastValue > firstValue + threshold) stats.trend = "increasing";
        else if (lastValue < firstValue - threshold) stats.trend = "decreasing";
        else stats.trend = "stable";
    }
  }

  res.json(stats);
});

module.exports = {
  addHealthMetric,
  getHealthMetrics,
  getHealthMetricById,
  updateHealthMetric,
  deleteHealthMetric,
  getHealthMetricsStats,
};

