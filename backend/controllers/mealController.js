 require("dotenv").config();
const asyncHandler = require("express-async-handler");
const axios = require("axios"); // Keep axios if needed for other things, or remove if not
const MealLog = require("../models/MealLog");
const User = require("../models/User");

// Removed Edamam API Configuration and helpers

// Helper function to calculate total nutrients for a meal based on its foods
// This helper assumes the input `foods` array has nutrients structured as { value: Number, unit: String }
const calculateMealTotals = (foods) => {
  const totals = {
    ENERC_KCAL: { value: 0, unit: "kcal" },
    PROCNT: { value: 0, unit: "g" },
    FAT: { value: 0, unit: "g" },
    CHOCDF: { value: 0, unit: "g" },
    FIBTG: { value: 0, unit: "g" },
  };

  if (!foods || !Array.isArray(foods)) {
    return totals;
  }

  foods.forEach(food => {
    // Assume food.nutrients contains values per 100g from USDA search, structured as objects
    // Assume food.quantity is a multiplier for the 100g amount (e.g., quantity 1.5 means 150g)
    const quantityMultiplier = food.quantity || 0;

    totals.ENERC_KCAL.value += (food.nutrients?.ENERC_KCAL?.value || 0) * quantityMultiplier;
    totals.PROCNT.value += (food.nutrients?.PROCNT?.value || 0) * quantityMultiplier;
    totals.FAT.value += (food.nutrients?.FAT?.value || 0) * quantityMultiplier;
    totals.CHOCDF.value += (food.nutrients?.CHOCDF?.value || 0) * quantityMultiplier;
    totals.FIBTG.value += (food.nutrients?.FIBTG?.value || 0) * quantityMultiplier;
  });

  // Round values
  totals.ENERC_KCAL.value = parseFloat(totals.ENERC_KCAL.value.toFixed(1));
  totals.PROCNT.value = parseFloat(totals.PROCNT.value.toFixed(1));
  totals.FAT.value = parseFloat(totals.FAT.value.toFixed(1));
  totals.CHOCDF.value = parseFloat(totals.CHOCDF.value.toFixed(1));
  totals.FIBTG.value = parseFloat(totals.FIBTG.value.toFixed(1));

  return totals;
};

// @desc    Log a meal
// @route   POST /api/meals
// @access  Private
const logMeal = asyncHandler(async (req, res) => {
  const { date, mealType, foods, notes } = req.body;

  if (!mealType || !foods || !Array.isArray(foods) || foods.length === 0) {
    res.status(400);
    throw new Error("Please provide meal type and at least one food item including quantity and nutrient data");
  }

  // Map foods, ensuring nutrients are structured as objects { value, unit }
  const foodsToLog = foods.map(food => {
    // Frontend sends nutrients as simple numbers (e.g., ENERC_KCAL: 197)
    // We need to convert them to the schema format { value: 197, unit: 'kcal' }
    const nutrientsFormatted = {
      ENERC_KCAL: { value: food.nutrients?.ENERC_KCAL || 0, unit: 'kcal' },
      PROCNT: { value: food.nutrients?.PROCNT || 0, unit: 'g' },
      FAT: { value: food.nutrients?.FAT || 0, unit: 'g' },
      CHOCDF: { value: food.nutrients?.CHOCDF || 0, unit: 'g' },
      FIBTG: { value: food.nutrients?.FIBTG || 0, unit: 'g' },
    };

    return {
      foodId: food.foodId, // fdcId from USDA
      name: food.name,
      quantity: food.quantity,
      measure: food.measureLabel || "100g unit",
      measureURI: food.measureURI,
      nutrients: nutrientsFormatted, // Store nutrients in the correct schema format
    };
  });

  // Create meal log - the pre-save hook will calculate totalNutrients
  const mealLog = new MealLog({
    user: req.user._id,
    date: date || new Date(),
    mealType,
    foods: foodsToLog,
    notes,
    // totalNutrients will be calculated by the pre-save hook in MealLog.js
    // totalDaily is no longer available
  });

  const createdMealLog = await mealLog.save(); // This triggers the pre-save hook

  if (createdMealLog) {
    res.status(201).json(createdMealLog);
  } else {
    res.status(400);
    throw new Error("Invalid meal data, failed to save");
  }
});

// @desc    Get all meal logs for a user
// @route   GET /api/meals
// @access  Private
const getMealLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, mealType } = req.query;
  const query = { user: req.user._id };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  } else {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    query.date = { $gte: todayStart, $lte: todayEnd };
  }

  if (mealType) query.mealType = mealType;

  const mealLogs = await MealLog.find(query).sort({ date: -1 });
  res.json(mealLogs);
});

// @desc    Get meal log by ID
// @route   GET /api/meals/:id
// @access  Private
const getMealLogById = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);
  if (mealLog && mealLog.user.toString() === req.user._id.toString()) {
    res.json(mealLog);
  } else {
    res.status(404);
    throw new Error("Meal log not found");
  }
});

// @desc    Update meal log
// @route   PUT /api/meals/:id
// @access  Private
const updateMealLog = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);

  if (!mealLog || mealLog.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Meal log not found");
  }

  const { date, mealType, foods, notes } = req.body;

  mealLog.date = date || mealLog.date;
  mealLog.mealType = mealType || mealLog.mealType;
  mealLog.notes = notes !== undefined ? notes : mealLog.notes;

  if (foods && Array.isArray(foods)) {
    // Map updated foods, ensuring nutrients are structured as objects { value, unit }
    mealLog.foods = foods.map((food) => {
        const nutrientsFormatted = {
            ENERC_KCAL: { value: food.nutrients?.ENERC_KCAL || 0, unit: 'kcal' },
            PROCNT: { value: food.nutrients?.PROCNT || 0, unit: 'g' },
            FAT: { value: food.nutrients?.FAT || 0, unit: 'g' },
            CHOCDF: { value: food.nutrients?.CHOCDF || 0, unit: 'g' },
            FIBTG: { value: food.nutrients?.FIBTG || 0, unit: 'g' },
        };
        return {
            foodId: food.foodId,
            name: food.name,
            quantity: food.quantity,
            measure: food.measureLabel || "100g unit",
            measureURI: food.measureURI,
            nutrients: nutrientsFormatted,
        };
    });
    // totalNutrients will be recalculated by the pre-save hook
    mealLog.totalDaily = {}; // Clear old Edamam daily values
  }

  const updatedMealLog = await mealLog.save(); // Triggers pre-save hook
  res.json(updatedMealLog);
});

// @desc    Delete meal log
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMealLog = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);
  if (mealLog && mealLog.user.toString() === req.user._id.toString()) {
    await MealLog.deleteOne({ _id: req.params.id });
    res.json({ message: "Meal log removed" });
  } else {
    res.status(404);
    throw new Error("Meal log not found");
  }
});

// @desc    Get meal statistics (e.g., daily totals)
// @route   GET /api/meals/stats
// @access  Private
const getMealStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const user = await User.findById(req.user._id).select('+healthProfile');

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end);
  if (!startDate) {
      start.setHours(0, 0, 0, 0);
  }
  if (!endDate) {
      end.setHours(23, 59, 59, 999);
  }

  const mealLogs = await MealLog.find({
    user: req.user._id,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  const periodTotal = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0
  };

  mealLogs.forEach(meal => {
    periodTotal.calories += meal.totalNutrients?.ENERC_KCAL?.value || 0;
    periodTotal.protein += meal.totalNutrients?.PROCNT?.value || 0;
    periodTotal.fat += meal.totalNutrients?.FAT?.value || 0;
    periodTotal.carbs += meal.totalNutrients?.CHOCDF?.value || 0;
    periodTotal.fiber += meal.totalNutrients?.FIBTG?.value || 0;
  });

  const nutritionNeeds = user.getNutritionalNeeds ? user.getNutritionalNeeds() : {
    calories: 2000, protein: 75, fat: 65, carbs: 275, fiber: 30
  };

  res.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    currentIntake: {
        calories: parseFloat(periodTotal.calories.toFixed(1)),
        protein: parseFloat(periodTotal.protein.toFixed(1)),
        fat: parseFloat(periodTotal.fat.toFixed(1)),
        carbs: parseFloat(periodTotal.carbs.toFixed(1)),
        fiber: parseFloat(periodTotal.fiber.toFixed(1)),
    },
    nutritionNeeds: nutritionNeeds,
    mealCount: mealLogs.length,
    meals: mealLogs
  });
});

const getFoodRecommendations = asyncHandler(async (req, res) => {
  try {
    // Get options from query parameters
    const options = {
      mealType: req.query.mealType || null,
      limit: parseInt(req.query.limit) || 10
    };

    // Get user profile with health data
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Calculate user's nutritional needs
    const dailyCalories = user.calculateDailyCalories();
    const bmi = user.calculateBMI();
    
    // Determine if user is trying to lose, maintain, or gain weight
    let calorieGoal = dailyCalories;
    if (user.targetWeight && user.targetWeight < user.weight) {
      // Weight loss goal: reduce calories by 15-20%
      calorieGoal = Math.round(dailyCalories * 0.85);
    } else if (user.targetWeight && user.targetWeight > user.weight) {
      // Weight gain goal: increase calories by 15%
      calorieGoal = Math.round(dailyCalories * 1.15);
    }

    // Calculate macro nutrient goals based on calorie goal
    const proteinGoal = Math.round((calorieGoal * 0.25) / 4); // 25% of calories from protein (4 cal/g)
    const fatGoal = Math.round((calorieGoal * 0.30) / 9);     // 30% of calories from fat (9 cal/g)
    const carbGoal = Math.round((calorieGoal * 0.45) / 4);    // 45% of calories from carbs (4 cal/g)
    const fiberGoal = Math.round(calorieGoal / 1000 * 14);    // ~14g per 1000 calories

    // Get recent meal history (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentMeals = await MealLog.find({
      user: req.user._id,
      date: { $gte: threeDaysAgo }
    }).sort({ date: -1 });

    // Calculate average daily intake from recent meals
    const dailyIntake = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    };

    // Group meals by day
    const mealsByDay = {};
    recentMeals.forEach(meal => {
      const dateKey = new Date(meal.date).toISOString().split('T')[0];
      if (!mealsByDay[dateKey]) {
        mealsByDay[dateKey] = [];
      }
      mealsByDay[dateKey].push(meal);
    });

    // Calculate average daily intake
    const days = Object.keys(mealsByDay);
    days.forEach(day => {
      const dayMeals = mealsByDay[day];
      let dayCalories = 0, dayProtein = 0, dayFat = 0, dayCarbs = 0, dayFiber = 0;
      
      dayMeals.forEach(meal => {
        dayCalories += meal.totalNutrients?.ENERC_KCAL?.value || 0;
        dayProtein += meal.totalNutrients?.PROCNT?.value || 0;
        dayFat += meal.totalNutrients?.FAT?.value || 0;
        dayCarbs += meal.totalNutrients?.CHOCDF?.value || 0;
        dayFiber += meal.totalNutrients?.FIBTG?.value || 0;
      });
      
      dailyIntake.calories += dayCalories;
      dailyIntake.protein += dayProtein;
      dailyIntake.fat += dayFat;
      dailyIntake.carbs += dayCarbs;
      dailyIntake.fiber += dayFiber;
    });
    
    // Calculate averages if we have data
    if (days.length > 0) {
      dailyIntake.calories = Math.round(dailyIntake.calories / days.length);
      dailyIntake.protein = Math.round(dailyIntake.protein / days.length);
      dailyIntake.fat = Math.round(dailyIntake.fat / days.length);
      dailyIntake.carbs = Math.round(dailyIntake.carbs / days.length);
      dailyIntake.fiber = Math.round(dailyIntake.fiber / days.length);
    }

    // Determine nutritional gaps
    const nutritionalGaps = {
      calories: calorieGoal - dailyIntake.calories,
      protein: proteinGoal - dailyIntake.protein,
      fat: fatGoal - dailyIntake.fat,
      carbs: carbGoal - dailyIntake.carbs,
      fiber: fiberGoal - dailyIntake.fiber
    };

    // Determine primary nutritional focus based on gaps
    let primaryNutrient = 'balanced';
    const gapThreshold = 0.2; // 20% threshold to determine significant gaps
    
    if (Math.abs(nutritionalGaps.protein / proteinGoal) > gapThreshold) {
      primaryNutrient = nutritionalGaps.protein > 0 ? 'high-protein' : 'low-protein';
    } else if (Math.abs(nutritionalGaps.fat / fatGoal) > gapThreshold) {
      primaryNutrient = nutritionalGaps.fat > 0 ? 'high-fat' : 'low-fat';
    } else if (Math.abs(nutritionalGaps.carbs / carbGoal) > gapThreshold) {
      primaryNutrient = nutritionalGaps.carbs > 0 ? 'high-carb' : 'low-carb';
    }

    // Build search queries based on nutritional needs and user preferences
    let searchQueries = [];
    
    // Filter by meal type if specified
    const mealType = options.mealType || '';
    
    // Add queries based on primary nutritional focus and meal type
    switch (primaryNutrient) {
      case 'high-protein':
        if (mealType === 'breakfast') {
          searchQueries.push('eggs', 'greek yogurt', 'protein pancakes', 'cottage cheese');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('chicken breast', 'salmon', 'turkey', 'lean beef', 'tofu');
        } else if (mealType === 'snack') {
          searchQueries.push('protein bar', 'nuts', 'jerky', 'protein shake');
        } else {
          searchQueries.push('chicken breast', 'salmon', 'greek yogurt', 'eggs', 'tofu');
        }
        break;
      case 'low-protein':
        if (mealType === 'breakfast') {
          searchQueries.push('oatmeal', 'fruit', 'toast', 'cereal');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('rice', 'pasta', 'vegetables', 'potatoes');
        } else if (mealType === 'snack') {
          searchQueries.push('fruit', 'crackers', 'pretzels');
        } else {
          searchQueries.push('rice', 'fruits', 'vegetables', 'bread');
        }
        break;
      case 'high-fat':
        if (mealType === 'breakfast') {
          searchQueries.push('avocado toast', 'nut butter', 'whole eggs');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('salmon', 'avocado', 'olive oil', 'nuts');
        } else if (mealType === 'snack') {
          searchQueries.push('nuts', 'cheese', 'avocado');
        } else {
          searchQueries.push('avocado', 'nuts', 'olive oil', 'cheese');
        }
        break;
      case 'low-fat':
        if (mealType === 'breakfast') {
          searchQueries.push('egg whites', 'low fat yogurt', 'fruit');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('chicken breast', 'turkey', 'white fish', 'vegetables');
        } else if (mealType === 'snack') {
          searchQueries.push('fruit', 'low fat yogurt', 'rice cakes');
        } else {
          searchQueries.push('lean meat', 'vegetables', 'fruits', 'grains');
        }
        break;
      case 'high-carb':
        if (mealType === 'breakfast') {
          searchQueries.push('oatmeal', 'banana', 'toast', 'cereal');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('pasta', 'rice', 'potatoes', 'beans');
        } else if (mealType === 'snack') {
          searchQueries.push('fruit', 'granola bar', 'crackers');
        } else {
          searchQueries.push('pasta', 'rice', 'potatoes', 'oats', 'bananas');
        }
        break;
      case 'low-carb':
        if (mealType === 'breakfast') {
          searchQueries.push('eggs', 'avocado', 'bacon', 'sausage');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('chicken', 'beef', 'fish', 'leafy greens');
        } else if (mealType === 'snack') {
          searchQueries.push('nuts', 'cheese', 'jerky');
        } else {
          searchQueries.push('leafy greens', 'meat', 'fish', 'eggs');
        }
        break;
      default:
        if (mealType === 'breakfast') {
          searchQueries.push('eggs', 'oatmeal', 'yogurt', 'fruit');
        } else if (mealType === 'lunch' || mealType === 'dinner') {
          searchQueries.push('chicken', 'fish', 'vegetables', 'rice');
        } else if (mealType === 'snack') {
          searchQueries.push('fruit', 'nuts', 'yogurt');
        } else {
          searchQueries.push('balanced meal', 'vegetables', 'fruits', 'lean protein');
        }
    }
    
    // Filter out foods that conflict with dietary restrictions
    if (user.allergies && user.allergies.length > 0) {
      // Remove queries that might contain allergens
      user.allergies.forEach(allergen => {
        const allergenLower = allergen.toLowerCase();
        searchQueries = searchQueries.filter(query => !query.toLowerCase().includes(allergenLower));
      });
    }
    
    if (user.dietaryRestrictions && user.dietaryRestrictions.length > 0) {
      // Handle dietary restrictions
      const isVegetarian = user.dietaryRestrictions.some(r => 
        r.toLowerCase().includes('vegetarian') || r.toLowerCase().includes('vegan'));
      
      if (isVegetarian) {
        // Remove meat-based queries and add vegetarian options
        searchQueries = searchQueries.filter(q => 
          !['chicken', 'meat', 'fish', 'salmon', 'beef', 'turkey', 'jerky', 'bacon', 'sausage'].some(meat => q.includes(meat)));
        searchQueries.push('tofu', 'lentils', 'beans', 'chickpeas');
      }
    }

    // Get recommendations from USDA API based on search queries
    const recommendations = [];
    
    // Limit to 3 search queries for performance
    const limitedQueries = searchQueries.slice(0, 3);
    
    // Fetch food data for each query
    for (const query of limitedQueries) {
      try {
        const params = {
          api_key: process.env.USDA_API_KEY,
          query: query,
          pageSize: 5, // Limit results per query
          dataType: ["Branded", "Foundation", "SR Legacy"].join(",")
        };
        
        const response = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search`, { params } );
        
        if (response.data && Array.isArray(response.data.foods)) {
          // Transform and add to recommendations
          const foods = response.data.foods.map(food => {
            // Find key nutrients
            const getNutrientValue = (nutrientId) => {
              const nutrient = food.foodNutrients?.find(n => n.nutrientId === nutrientId);
              return nutrient?.value || 0;
            };
            
            return {
              id: food.fdcId,
              name: food.description,
              brand: food.brandOwner || food.brandName,
              category: food.dataType,
              image: null, // USDA API doesn't provide images directly
              nutrients: {
                ENERC_KCAL: getNutrientValue(1008), // Energy in Kcal
                PROCNT: getNutrientValue(1003),     // Protein
                FAT: getNutrientValue(1004),        // Total lipid (fat)
                CHOCDF: getNutrientValue(1005),     // Carbohydrate
                FIBTG: getNutrientValue(1079)       // Fiber
              },
              measures: [{ label: "100g", weight: 100 }],
              // Add recommendation reason based on nutritional focus
              recommendationReason: getRecommendationReason(primaryNutrient, nutritionalGaps)
            };
          });
          
          recommendations.push(...foods);
        }
      } catch (error) {
        console.error(`Error fetching recommendations for query "${query}":`, error);
        // Continue with other queries even if one fails
      }
    }
    
    // Remove duplicates (by ID)
    const uniqueRecommendations = recommendations.filter((food, index, self) =>
      index === self.findIndex(f => f.id === food.id)
    );
    
    // Sort recommendations by relevance to nutritional needs
    const sortedRecommendations = sortRecommendationsByRelevance(
      uniqueRecommendations, 
      primaryNutrient, 
      nutritionalGaps
    );
    
    // Return recommendations with nutritional context
    res.json({
      success: true,
      message: "Food recommendations generated successfully",
      recommendations: sortedRecommendations.slice(0, 10), // Limit to top 10
      nutritionalContext: {
        calorieGoal,
        proteinGoal,
        fatGoal,
        carbGoal,
        fiberGoal,
        currentIntake: dailyIntake,
        nutritionalGaps,
        primaryNutrient
      }
    });
    
  } catch (error) {
    console.error("Error in food recommendations:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate food recommendations",
      error: error.message
    });
  }
});

/**
 * Get recommendation reason based on nutritional focus
 * @param {string} primaryNutrient - The primary nutritional focus
 * @param {Object} nutritionalGaps - The user's nutritional gaps
 * @returns {string} - Recommendation reason
 */
const getRecommendationReason = (primaryNutrient, nutritionalGaps) => {
  switch (primaryNutrient) {
    case 'high-protein':
      return 'Recommended to help meet your protein goals';
    case 'low-protein':
      return 'Recommended to balance your protein intake';
    case 'high-fat':
      return 'Recommended to increase healthy fat intake';
    case 'low-fat':
      return 'Recommended to reduce fat intake';
    case 'high-carb':
      return 'Recommended to increase your energy intake';
    case 'low-carb':
      return 'Recommended to balance your carbohydrate intake';
    default:
      return 'Recommended for a balanced diet';
  }
};

/**
 * Sort recommendations by relevance to nutritional needs
 * @param {Array} recommendations - The food recommendations
 * @param {string} primaryNutrient - The primary nutritional focus
 * @param {Object} nutritionalGaps - The user's nutritional gaps
 * @returns {Array} - Sorted recommendations
 */
const sortRecommendationsByRelevance = (recommendations, primaryNutrient, nutritionalGaps) => {
  return recommendations.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Score based on primary nutritional focus
    switch (primaryNutrient) {
      case 'high-protein':
        scoreA = a.nutrients.PROCNT || 0;
        scoreB = b.nutrients.PROCNT || 0;
        break;
      case 'low-protein':
        scoreA = -(a.nutrients.PROCNT || 0);
        scoreB = -(b.nutrients.PROCNT || 0);
        break;
      case 'high-fat':
        scoreA = a.nutrients.FAT || 0;
        scoreB = b.nutrients.FAT || 0;
        break;
      case 'low-fat':
        scoreA = -(a.nutrients.FAT || 0);
        scoreB = -(b.nutrients.FAT || 0);
        break;
      case 'high-carb':
        scoreA = a.nutrients.CHOCDF || 0;
        scoreB = b.nutrients.CHOCDF || 0;
        break;
      case 'low-carb':
        scoreA = -(a.nutrients.CHOCDF || 0);
        scoreB = -(b.nutrients.CHOCDF || 0);
        break;
      default:
        // For balanced, prioritize foods with good nutrient density
        scoreA = (a.nutrients.PROCNT || 0) + (a.nutrients.FIBTG || 0);
        scoreB = (b.nutrients.PROCNT || 0) + (b.nutrients.FIBTG || 0);
    }
    
    return scoreB - scoreA; // Higher score first
  });
};



module.exports = {
  logMeal,
  getMealLogs,
  getMealLogById,
  updateMealLog,
  deleteMealLog,
  getMealStats,
  getFoodRecommendations  // Add this line
};