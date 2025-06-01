# Food Data API Integration for WhichFood Application

After thorough research and evaluation of available food and nutrition database APIs, this document outlines the selected API solution for integration with the WhichFood application.

## API Selection Comparison

### 1. USDA FoodData Central API

**Pros:**
- Free for public use with API key
- Comprehensive database with detailed nutritional information
- Public domain data (CC0 1.0 Universal)
- Highly reliable government source
- Includes Standard Reference (SR) Legacy data, USDA Global Branded Foods Database, Foundation Foods, and FNDDS data

**Cons:**
- Rate limited to 1,000 requests per hour per IP address by default
- May require additional processing for user-friendly presentation
- Less focused on branded food products compared to commercial alternatives

### 2. Edamam Food Database API

**Pros:**
- Close to 900,000 foods and over 680,000 unique UPC codes
- Excellent search capabilities (keyword, food name, UPC/Barcode)
- Comprehensive nutrient data including allergen labels, lifestyle and health labels
- Built-in food-logging context for NLP requests
- Well-structured API with clear documentation

**Cons:**
- Free tier has limitations
- Requires attribution
- Commercial service with potential future pricing changes

## Selected API: Edamam Food Database API

After careful consideration, the Edamam Food Database API has been selected for integration with the WhichFood application for the following reasons:

1. **Comprehensive Coverage**: With nearly 900,000 foods and 680,000 UPC codes, it provides extensive coverage of both generic and branded food items.

2. **Rich Nutritional Data**: Includes detailed macro and micronutrients, allergen information, and health labels that align perfectly with the WhichFood application requirements.

3. **Search Flexibility**: Supports multiple search methods including keyword, food name, and UPC/barcode scanning, which is essential for the meal logging functionality.

4. **NLP Capabilities**: The built-in food-logging context for natural language processing will enhance the user experience when logging meals.

5. **Well-Structured Responses**: The API provides well-organized data that can be easily integrated into our application models.

## Integration Requirements

### API Access

- **Base URL**: https://api.edamam.com
- **Authentication**: Requires app_id and app_key
- **Endpoints**:
  - Food Search: `/api/food-database/v2/parser`
  - Nutrients: `/api/food-database/v2/nutrients`

### Key Features to Implement

1. **Food Search Functionality**:
   - Search by text query
   - Filter by food category (generic-foods, packaged-foods, generic-meals)
   - Support for barcode scanning

2. **Nutritional Data Retrieval**:
   - Extract comprehensive nutrient information
   - Process allergen and health labels
   - Calculate daily nutritional values based on user profiles

3. **Data Caching Strategy**:
   - Implement local caching of frequently accessed food items
   - Store user's favorite and recent food selections

### Data Model Integration

The API data will be mapped to our application's data models as follows:

```javascript
// Food Item Model
const FoodItemSchema = {
  edamamId: String,  // Unique identifier from Edamam
  foodName: String,
  brand: String,
  category: String,
  image: String,
  nutrients: {
    ENERC_KCAL: { value: Number, unit: String },
    PROCNT: { value: Number, unit: String },
    FAT: { value: Number, unit: String },
    CHOCDF: { value: Number, unit: String },
    FIBTG: { value: Number, unit: String },
    // Additional nutrients as needed
  },
  healthLabels: [String],
  dietLabels: [String],
  allergenLabels: [String],
  measures: [{
    uri: String,
    label: String,
    weight: Number
  }]
};

// Meal Log Model
const MealLogSchema = {
  userId: String,
  date: Date,
  mealType: String,  // breakfast, lunch, dinner, snack
  foods: [{
    foodItem: { type: ObjectId, ref: 'FoodItem' },
    quantity: Number,
    measure: String,
    nutrients: {
      // Calculated nutrients based on quantity and measure
    }
  }],
  totalNutrients: {
    // Aggregated nutrients for the entire meal
  }
};
```

## Implementation Plan

1. **Setup API Access**:
   - Register for Edamam API credentials
   - Configure environment variables for secure storage of API keys

2. **Create API Service Layer**:
   - Develop a service module to handle all API interactions
   - Implement error handling and rate limiting protection

3. **Build Data Processing Utilities**:
   - Create functions to transform API responses into application data models
   - Develop nutrient calculation utilities based on portions and measures

4. **Implement Caching Mechanism**:
   - Set up Redis for caching frequently accessed food data
   - Implement cache invalidation strategies

5. **Develop User Interface Components**:
   - Create food search interface with autocomplete
   - Build barcode scanning component
   - Design nutrient visualization components

## API Usage Examples

### Food Search Example

```javascript
// Example API request
const searchFood = async (query) => {
  try {
    const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: {
        app_id: process.env.EDAMAM_APP_ID,
        app_key: process.env.EDAMAM_APP_KEY,
        ingr: query,
        category: 'generic-foods,packaged-foods',
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching food:', error);
    throw error;
  }
};
```

### Nutrient Calculation Example

```javascript
// Example nutrient calculation
const calculateNutrients = (food, quantity, measureURI) => {
  const selectedMeasure = food.measures.find(m => m.uri === measureURI);
  
  if (!selectedMeasure) {
    throw new Error('Measure not found');
  }
  
  const nutrients = {};
  const ratio = quantity * selectedMeasure.weight / 100;
  
  Object.entries(food.nutrients).forEach(([nutrientId, nutrientData]) => {
    nutrients[nutrientId] = {
      value: nutrientData.value * ratio,
      unit: nutrientData.unit
    };
  });
  
  return nutrients;
};
```

## Attribution Requirements

As required by Edamam's terms of service, the application will include proper attribution:

- "Powered by Edamam" logo in the application footer
- Link to Edamam's website where nutritional data is displayed
- Attribution in the application's about/credits section

## Conclusion

The Edamam Food Database API provides a robust solution for the WhichFood application's nutritional data needs. Its comprehensive coverage, detailed nutrient information, and flexible search capabilities make it an ideal choice for supporting the application's core features of meal logging, health monitoring, and personalized food recommendations.

The integration will be implemented following the outlined plan, ensuring efficient data retrieval, processing, and presentation to meet the application's requirements while providing users with accurate and valuable nutritional information.
