const mongoose = require('mongoose');

const MealLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  foods: [{
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem'
    },
    edamamId: {
      type: String
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    measure: {
      type: String,
      required: true
    },
    nutrients: {
      ENERC_KCAL: { 
        value: Number, 
        unit: String 
      },
      PROCNT: { 
        value: Number, 
        unit: String 
      },
      FAT: { 
        value: Number, 
        unit: String 
      },
      CHOCDF: { 
        value: Number, 
        unit: String 
      },
      FIBTG: { 
        value: Number, 
        unit: String 
      },
      // Additional nutrients can be added as needed
    }
  }],
  totalNutrients: {
    ENERC_KCAL: { 
      value: Number, 
      unit: String 
    },
    PROCNT: { 
      value: Number, 
      unit: String 
    },
    FAT: { 
      value: Number, 
      unit: String 
    },
    CHOCDF: { 
      value: Number, 
      unit: String 
    },
    FIBTG: { 
      value: Number, 
      unit: String 
    },
    // Additional nutrients can be added as needed
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate total nutrients before saving
MealLogSchema.pre('save', function(next) {
  // Initialize total nutrients
  this.totalNutrients = {
    ENERC_KCAL: { value: 0, unit: 'kcal' },
    PROCNT: { value: 0, unit: 'g' },
    FAT: { value: 0, unit: 'g' },
    CHOCDF: { value: 0, unit: 'g' },
    FIBTG: { value: 0, unit: 'g' }
  };
  
  // Sum up nutrients from all foods
  this.foods.forEach(food => {
    Object.keys(food.nutrients).forEach(nutrient => {
      if (this.totalNutrients[nutrient]) {
        this.totalNutrients[nutrient].value += food.nutrients[nutrient].value;
        this.totalNutrients[nutrient].unit = food.nutrients[nutrient].unit;
      }
    });
  });
  
  next();
});

module.exports = mongoose.model('MealLog', MealLogSchema);
