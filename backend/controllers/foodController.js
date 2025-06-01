require("dotenv").config(); // Load environment variables
const asyncHandler = require("express-async-handler");
const axios = require("axios");

// Environment variables for Edamam API
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_FOOD_DB_URL = "https://api.edamam.com/api/food-database/v2";
const EDAMAM_NUTRIENTS_URL = "https://api.edamam.com/api/food-database/v2/nutrients"; // Specific endpoint for nutrients

// Search food by query using Edamam Parser endpoint
const searchFood = asyncHandler(async (req, res) => {
  const { query, category } = req.query;

  if (!query) {
    res.status(400);
    throw new Error("Please provide a search query");
  }

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.error("Edamam API credentials missing in environment variables.");
    res.status(500);
    throw new Error("Server configuration error: Edamam API credentials are missing");
  }

  try {
    const response = await axios.get(`${EDAMAM_FOOD_DB_URL}/parser`, {
      params: {
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        ingr: query,
        // Default categories if not provided
        category: category || "generic-foods,packaged-foods,fast-foods", 
        // Request specific nutrients if needed, e.g., nutrition-type=logging
      },
    });

    // Transform the data to a more frontend-friendly format
    const foods = response.data.hints.map((hint) => ({
      // Use foodId if available, otherwise generate a temporary one (though foodId is usually present)
      id: hint.food.foodId,
      name: hint.food.label,
      brand: hint.food.brand,
      category: hint.food.category,
      image: hint.food.image,
      // Extract key nutrients, provide defaults if missing
      nutrients: {
        ENERC_KCAL: hint.food.nutrients?.ENERC_KCAL || 0,
        PROCNT: hint.food.nutrients?.PROCNT || 0,
        CHOCDF: hint.food.nutrients?.CHOCDF || 0, // Total Carbs
        FAT: hint.food.nutrients?.FAT || 0,
        FIBTG: hint.food.nutrients?.FIBTG || 0, // Fiber
      },
      // Provide available measures for quantity selection
      measures: hint.measures.map(m => ({ uri: m.uri, label: m.label, weight: m.weight })),
    }));

    // Return the transformed list
    res.json({ foods }); // Changed from { hints: foods } to { foods: foods }

  } catch (error) {
    console.error("Error searching food via Edamam:", error.response?.data || error.message);
    res.status(error.response?.status || 500);
    throw new Error(error.response?.data?.message || "Failed to search for food items");
  }
});

// Get detailed food nutrients using Edamam Nutrients endpoint
const getFoodNutrients = asyncHandler(async (req, res) => {
  // Expecting payload like: { ingredients: [ { quantity: 1, measureURI: "...", foodId: "..." } ] }
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400);
    throw new Error("Please provide valid ingredients data (quantity, measureURI, foodId)");
  }

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.error("Edamam API credentials missing in environment variables.");
    res.status(500);
    throw new Error("Server configuration error: Edamam API credentials are missing");
  }

  try {
    // Prepare payload for Edamam Nutrients API
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

    // Return the full nutrient analysis from Edamam
    res.json(response.data);

  } catch (error) {
    console.error("Error getting nutrients from Edamam:", error.response?.data || error.message);
    res.status(error.response?.status || 500);
    throw new Error(error.response?.data?.message || "Failed to get nutritional information");
  }
});

module.exports = {
  searchFood,
  getFoodNutrients,
};

