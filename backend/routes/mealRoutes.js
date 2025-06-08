const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  logMeal,
  getMealLogs,
  getMealLogById,
  updateMealLog,
  deleteMealLog,
  getMealStats,
  getFoodRecommendations
} = require('../controllers/mealController');

// All routes are protected
router.route('/')
  .post(protect, logMeal)
  .get(protect, getMealLogs);

router.route('/stats')
  .get(protect, getMealStats);

router.route('/recommendations')
  .get(protect, getFoodRecommendations);


router.route('/:id')
  .get(protect, getMealLogById)
  .put(protect, updateMealLog)
  .delete(protect, deleteMealLog);

module.exports = router;
