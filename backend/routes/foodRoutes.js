const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  searchFood,
  getFoodNutrients
} = require('../controllers/foodController');

// All routes are protected
router.route('/search')
  .get(protect, searchFood);

router.route('/nutrients')
  .post(protect, getFoodNutrients);

module.exports = router;
