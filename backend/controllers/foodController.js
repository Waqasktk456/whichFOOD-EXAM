require("dotenv").config();
const asyncHandler = require("express-async-handler");
const axios = require("axios");

// USDA API Key
const USDA_API_KEY =Yy4TZKCcjarwrNEjsQdQJ6hKTeodQTU12ryuFNdO;
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1";

// Search food using USDA FoodData Central API
const searchFood = asyncHandler(async (req, res ) => {
  const { query } = req.query;
  console.log(`[searchFood] Received USDA search request for query: "${query}"`);

  if (!query) {
    console.warn("[searchFood] Missing search query.");
    res.status(400);
    throw new Error("Please provide a search query");
  }

  if (!USDA_API_KEY) {
    console.error("[searchFood] USDA API Key missing in environment variables.");
    res.status(500);
    throw new Error("Server configuration error: USDA API Key is missing");
  }

  const params = {
    api_key: USDA_API_KEY,
    query: query,
    pageSize: 20, // Limit results, adjust as needed
    dataType: ["Branded", "Foundation", "SR Legacy"].join(",") // Search across relevant types
  };

  const url = `${USDA_API_URL}/foods/search`;
  console.log(`[searchFood] Calling USDA API: ${url} with params:`, { ...params, api_key: 'HIDDEN' });

  try {
    const response = await axios.get(url, { params });

    console.log("[searchFood] Raw USDA API Response Status:", response.status);
    // console.log("[searchFood] Raw USDA API Response Data:", JSON.stringify(response.data, null, 2)); // Optional: Log raw data for debugging

    if (!response.data || !Array.isArray(response.data.foods)) {
      console.warn("[searchFood] USDA response missing 'foods' array or is not an array.");
      return res.json({ foods: [] });
    }

    // Transform USDA data to the format your frontend expects
    const foods = response.data.foods.map((food) => {
      // Find key nutrients (calories, protein, fat, carbs)
      const getNutrientValue = (nutrientId) => {
        const nutrient = food.foodNutrients?.find(n => n.nutrientId === nutrientId);
        // Use nutrientNumber for consistency if available, fallback to nutrientId for mapping
        // Use value, default to 0 if not found
        return nutrient?.value || 0;
      };

      return {
        id: food.fdcId, // Use fdcId as the unique identifier
        name: food.description,
        brand: food.brandOwner || food.brandName, // Combine owner/name for brand
        category: food.dataType,
        image: null, // USDA API doesn't typically provide images directly
        nutrients: {
          ENERC_KCAL: getNutrientValue(1008), // Energy in Kcal
          PROCNT: getNutrientValue(1003),     // Protein
          FAT: getNutrientValue(1004),        // Total lipid (fat)
          CHOCDF: getNutrientValue(1005),     // Carbohydrate, by difference
          FIBTG: getNutrientValue(1079)       // Fiber, total dietary (might need different ID based on data type)
        },
        // USDA API provides nutrients per 100g/100ml by default.
        // Measures are complex in USDA data (portions, weights). 
        // For simplicity, we'll omit specific measures here.
        // You might need a separate call to /food/{fdcId} for detailed portion/measure info if required.
        measures: [{ label: "100g", weight: 100 }] // Placeholder measure
      };
    });

    console.log(`[searchFood] Found ${foods.length} foods.`);
    // console.log("[searchFood] Transformed foods data:", JSON.stringify(foods, null, 2)); // Optional: Log transformed data

    res.json({ foods });

  } catch (error) {
    if (error.response) {
      console.error("[searchFood] USDA API Error Status:", error.response.status);
      console.error("[searchFood] USDA API Error Data:", JSON.stringify(error.response.data, null, 2));
      res.status(error.response.status);
      throw new Error(error.response.data?.message || `USDA API request failed with status ${error.response.status}`);
    } else if (error.request) {
      console.error("[searchFood] USDA API No Response Error:", error.request);
      res.status(503);
      throw new Error("Failed to reach USDA API. Check network connection or API status.");
    } else {
      console.error("[searchFood] Axios Request Setup Error:", error.message);
      res.status(500);
      throw new Error("Internal server error during food search setup.");
    }
  }
});

// Note: The getFoodNutrients function needs significant changes or removal.
// USDA provides nutrients per 100g in search results.
// Getting nutrients for specific *portions* requires calling the /food/{fdcId} endpoint
// and parsing its complex structure, which is beyond this basic replacement.
// For now, the frontend will have to work with the per-100g data provided by search.

// Placeholder/Removed getFoodNutrients
const getFoodNutrients = asyncHandler(async (req, res) => {
  console.warn("[getFoodNutrients] This function is not implemented for USDA API in this basic example.");
  res.status(501).json({ message: "Nutrient lookup for specific portions not implemented for USDA API in this example." });
});

module.exports = {
  searchFood,
  getFoodNutrients, // Keep export, but it's non-functional for now
};
