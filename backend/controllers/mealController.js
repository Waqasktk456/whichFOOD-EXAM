require("dotenv").config();
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const MealLog = require("../models/MealLog");
const User = require("../models/User"); // Assuming User model exists and is correctly set up

// Edamam API Configuration
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_NUTRIENTS_URL = "https://api.edamam.com/api/food-database/v2/nutrients";
const EDAMAM_RECIPE_URL = "https://api.edamam.com/api/recipes/v2"; // For recipe recommendations

// Helper function to get nutrients from Edamam
const getNutrientsForIngredients = async (ingredients) => {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.error("Edamam API credentials missing.");
    throw new Error("Server configuration error: Edamam API credentials missing.");
  }
  if (!ingredients || ingredients.length === 0) {
    return null; // No ingredients to fetch
  }

  try {
    const payload = {
      ingredients: ingredients.map(item => ({
        quantity: item.quantity,
        measureURI: item.measureURI,
        foodId: item.foodId,
      })),
    };
    const response = await axios.post(
      EDAMAM_NUTRIENTS_URL,
      payload,
      {
        params: {
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY,
        },
      }
    );
    return response.data; // Return full nutrient analysis
  } catch (error) {
    console.error("Error fetching nutrients from Edamam:", error.response?.data || error.message);
    // Don't throw error here, allow meal logging to proceed without nutrients if API fails
    return null;
  }
};

// @desc    Log a meal with nutrient calculation
// @route   POST /api/meals
// @access  Private
const logMeal = asyncHandler(async (req, res) => {
  const { date, mealType, foods, notes } = req.body;

  if (!mealType || !foods || !Array.isArray(foods) || foods.length === 0) {
    res.status(400);
    throw new Error("Please provide meal type and at least one food item with quantity, measureURI, and foodId");
  }

  // Prepare ingredients for Edamam nutrient lookup
  const ingredientsForApi = foods.map(food => ({
    quantity: food.quantity,
    measureURI: food.measureURI, // Ensure frontend sends this
    foodId: food.foodId,         // Ensure frontend sends this
  }));

  // Fetch nutrients from Edamam
  const nutrientData = await getNutrientsForIngredients(ingredientsForApi);

  // Map foods with fetched nutrients (or defaults if API fails)
  const foodsToLog = foods.map((food, index) => {
    let nutrients = {};
    // Find corresponding nutrient info (assuming order is preserved, which might be risky)
    // A better approach might match by foodId if the API provided per-ingredient breakdown
    // For now, we assume the API returns total nutrients, which we distribute or store per food item if possible.
    // Edamam /nutrients returns TOTAL nutrients. We store this at the meal level.
    // We can store basic nutrients per food item if available from the initial search.
    nutrients = {
      ENERC_KCAL: { value: food.nutrients?.ENERC_KCAL || 0, unit: "kcal" },
      PROCNT: { value: food.nutrients?.PROCNT || 0, unit: "g" },
      FAT: { value: food.nutrients?.FAT || 0, unit: "g" },
      CHOCDF: { value: food.nutrients?.CHOCDF || 0, unit: "g" },
      FIBTG: { value: food.nutrients?.FIBTG || 0, unit: "g" },
    };

    return {
      foodId: food.foodId,
      name: food.name, // Ensure frontend sends name
      quantity: food.quantity,
      measure: food.measureLabel, // Use label from frontend
      measureURI: food.measureURI,
      nutrients: nutrients, // Store basic nutrients per food item
    };
  });

  // Create meal log
  const mealLog = new MealLog({
    user: req.user._id,
    date: date || new Date(),
    mealType,
    foods: foodsToLog,
    notes,
    // Store total nutrients from Edamam response if available
    totalNutrients: nutrientData?.totalNutrients || {},
    totalDaily: nutrientData?.totalDaily || {},
  });

  // The pre-save hook in MealLog model might recalculate totalNutrients based on individual foods.
  // We might want to disable that if we trust Edamam's total.
  // For now, let's assume the model's pre-save hook is removed or adjusted.

  const createdMealLog = await mealLog.save();

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

  // Update basic fields
  mealLog.date = date || mealLog.date;
  mealLog.mealType = mealType || mealLog.mealType;
  mealLog.notes = notes !== undefined ? notes : mealLog.notes;

  // If foods are updated, recalculate nutrients
  if (foods && Array.isArray(foods)) {
    const ingredientsForApi = foods.map(food => ({
      quantity: food.quantity,
      measureURI: food.measureURI,
      foodId: food.foodId,
    }));

    const nutrientData = await getNutrientsForIngredients(ingredientsForApi);

    mealLog.foods = foods.map((food) => ({
      foodId: food.foodId,
      name: food.name,
      quantity: food.quantity,
      measure: food.measureLabel,
      measureURI: food.measureURI,
      nutrients: {
        ENERC_KCAL: { value: food.nutrients?.ENERC_KCAL || 0, unit: "kcal" },
        PROCNT: { value: food.nutrients?.PROCNT || 0, unit: "g" },
        FAT: { value: food.nutrients?.FAT || 0, unit: "g" },
        CHOCDF: { value: food.nutrients?.CHOCDF || 0, unit: "g" },
        FIBTG: { value: food.nutrients?.FIBTG || 0, unit: "g" },
      },
    }));

    mealLog.totalNutrients = nutrientData?.totalNutrients || {};
    mealLog.totalDaily = nutrientData?.totalDaily || {};
  }

  const updatedMealLog = await mealLog.save();
  res.json(updatedMealLog);
});

// @desc    Delete meal log
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMealLog = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);
  if (mealLog && mealLog.user.toString() === req.user._id.toString()) {
    // Use deleteOne() instead of remove()
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
  const user = await User.findById(req.user._id).select('+healthProfile'); // Ensure healthProfile is selected if needed

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Default to today if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end);
  if (!startDate) {
      start.setHours(0, 0, 0, 0); // Start of today
  }
  if (!endDate) {
      end.setHours(23, 59, 59, 999); // End of today
  }

  // Get meal logs for the period
  const mealLogs = await MealLog.find({
    user: req.user._id,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  // Calculate totals for the period (e.g., today's total)
  const periodTotal = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0
    // Add other nutrients as needed
  };

  mealLogs.forEach(meal => {
    periodTotal.calories += meal.totalNutrients?.ENERC_KCAL?.quantity || meal.totalNutrients?.ENERC_KCAL?.value || 0;
    periodTotal.protein += meal.totalNutrients?.PROCNT?.quantity || meal.totalNutrients?.PROCNT?.value || 0;
    periodTotal.fat += meal.totalNutrients?.FAT?.quantity || meal.totalNutrients?.FAT?.value || 0;
    periodTotal.carbs += meal.totalNutrients?.CHOCDF?.quantity || meal.totalNutrients?.CHOCDF?.value || 0;
    periodTotal.fiber += meal.totalNutrients?.FIBTG?.quantity || meal.totalNutrients?.FIBTG?.value || 0;
  });

  // Get user's nutritional needs (assuming a method or profile field exists)
  // Placeholder: Replace with actual calculation based on user profile
  const nutritionNeeds = user.getNutritionalNeeds ? user.getNutritionalNeeds() : {
    calories: 2000, protein: 75, fat: 65, carbs: 275, fiber: 30
    // Add other nutrients
  };

  res.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    currentIntake: periodTotal,
    nutritionNeeds: nutritionNeeds,
    mealCount: mealLogs.length,
    meals: mealLogs // Optionally return the logs themselves
  });
});

// @desc    Get food recommendations (using Edamam Recipe API)
// @route   GET /api/meals/recommendations
// @access  Private
const getFoodRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+healthProfile +dietaryRestrictions +allergies');

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 1. Calculate current intake for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysMeals = await MealLog.find({
    user: req.user._id,
    date: { $gte: todayStart, $lte: todayEnd }
  });

  const currentIntake = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0
  };
  todaysMeals.forEach(meal => {
    currentIntake.calories += meal.totalNutrients?.ENERC_KCAL?.quantity || meal.totalNutrients?.ENERC_KCAL?.value || 0;
    currentIntake.protein += meal.totalNutrients?.PROCNT?.quantity || meal.totalNutrients?.PROCNT?.value || 0;
    currentIntake.fat += meal.totalNutrients?.FAT?.quantity || meal.totalNutrients?.FAT?.value || 0;
    currentIntake.carbs += meal.totalNutrients?.CHOCDF?.quantity || meal.totalNutrients?.CHOCDF?.value || 0;
    currentIntake.fiber += meal.totalNutrients?.FIBTG?.quantity || meal.totalNutrients?.FIBTG?.value || 0;
  });

  // 2. Get user's nutritional needs
  const nutritionNeeds = user.getNutritionalNeeds ? user.getNutritionalNeeds() : {
    calories: 2000, protein: 75, fat: 65, carbs: 275, fiber: 30
    // Add other relevant nutrients like calcium, iron, etc.
  };

  // 3. Determine remaining needs
  const remaining = {
    calories: Math.max(0, nutritionNeeds.calories - currentIntake.calories),
    protein: Math.max(0, nutritionNeeds.protein - currentIntake.protein),
    fat: Math.max(0, nutritionNeeds.fat - currentIntake.fat),
    carbs: Math.max(0, nutritionNeeds.carbs - currentIntake.carbs),
    fiber: Math.max(0, nutritionNeeds.fiber - currentIntake.fiber),
  };

  // 4. Formulate search query for Edamam Recipe API
  let queryKeywords = [];
  // Prioritize major deficits
  if (remaining.protein > nutritionNeeds.protein * 0.3) queryKeywords.push("high protein");
  if (remaining.fiber > nutritionNeeds.fiber * 0.3) queryKeywords.push("high fiber");
  if (remaining.calories < 500 && remaining.calories > 0) queryKeywords.push("low calorie");
  else if (remaining.calories > 500) queryKeywords.push("healthy meal"); // General term if calories needed
  else queryKeywords.push("healthy snack"); // If calories met, suggest snack

  const query = queryKeywords.join(" ") || "healthy recipe"; // Fallback query

  // 5. Prepare Edamam Recipe API parameters
  const params = {
    type: "public",
    app_id: EDAMAM_APP_ID,
    app_key: EDAMAM_APP_KEY,
    q: query,
    // Add user dietary restrictions and allergies
    health: [...(user.dietaryRestrictions || []), ...(user.allergies?.map(a => `${a}-free`) || [])],
    // Add calorie range based on remaining needs (e.g., for a single meal)
    calories: `${Math.max(100, remaining.calories * 0.3)}-${Math.max(300, remaining.calories * 0.6)}`, // Example range for one meal
    // Add nutrient constraints if needed (e.g., FAT_max, PROCNT_min)
    // Example: If protein needed: nutrients%5BPROCNT%5D=15%2B (URL encoded)
    // nutrients: { PROCNT: `${Math.max(10, remaining.protein * 0.3)}+` }
    random: true, // Get varied results
  };

  // Remove empty health parameters
  params.health = params.health.filter(h => h);
  if (params.health.length === 0) delete params.health;

  // 6. Call Edamam Recipe API
  let recommendations = [];
  let message = "Based on your needs today, here are some recipe ideas:";
  try {
    const response = await axios.get(EDAMAM_RECIPE_URL, { params });
    recommendations = response.data.hits.map(hit => ({
      recipe: {
        label: hit.recipe.label,
        image: hit.recipe.image,
        url: hit.recipe.url,
        yield: hit.recipe.yield,
        dietLabels: hit.recipe.dietLabels,
        healthLabels: hit.recipe.healthLabels,
        calories: hit.recipe.calories,
        totalNutrients: hit.recipe.totalNutrients,
        // Add simple reasons based on query/needs
      },
      reasons: [`Matches search: "${query}"`] // Simple reason
    }));
    if (recommendations.length === 0) {
        message = "Couldn't find specific recipes matching all criteria, showing general healthy options.";
        // Optional: Fallback search with fewer constraints
    }

  } catch (error) {
    console.error("Error fetching recipe recommendations from Edamam:", error.response?.data || error.message);
    message = "Could not fetch recipe recommendations at this time. Showing generic suggestions.";
    // Provide generic fallback recommendations (similar to previous version)
    recommendations = getGenericFoodRecommendations(user.dietaryRestrictions);
  }

  // 7. Return results
  res.json({
    message,
    nutritionNeeds,
    currentIntake,
    recommendations,
  });
});

// Helper for generic fallback recommendations
const getGenericFoodRecommendations = (dietaryRestrictions = []) => {
  // Simplified version of the previous generic recommendations
  const allFoods = [
    { recipe: { label: 'Grilled Chicken Salad', calories: 350, healthLabels: ['high-protein'] }, reasons: ['Good source of lean protein'] },
    { recipe: { label: 'Lentil Soup', calories: 300, healthLabels: ['high-fiber', 'vegetarian', 'vegan'] }, reasons: ['High in fiber and plant-based protein'] },
    { recipe: { label: 'Avocado Toast with Egg', calories: 400, healthLabels: ['healthy-fat', 'vegetarian'] }, reasons: ['Provides healthy fats and protein'] },
    { recipe: { label: 'Quinoa Bowl with Roasted Vegetables', calories: 450, healthLabels: ['high-fiber', 'vegetarian', 'vegan', 'gluten-free'] }, reasons: ['Balanced meal with complex carbs and fiber'] },
  ];

  const isVegetarian = dietaryRestrictions.includes('vegetarian');
  const isVegan = dietaryRestrictions.includes('vegan');

  return allFoods.filter(food => {
    if (isVegan && !food.recipe.healthLabels.includes('vegan')) return false;
    if (isVegetarian && !food.recipe.healthLabels.includes('vegetarian') && !food.recipe.healthLabels.includes('vegan')) return false;
    return true;
  }).slice(0, 5); // Return top 5 matching generic options
};

module.exports = {
  logMeal,
  getMealLogs,
  getMealLogById,
  updateMealLog,
  deleteMealLog,
  getMealStats,
  getFoodRecommendations,
};

