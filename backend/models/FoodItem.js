const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
  edamamId: {
    type: String,
    required: true,
    unique: true
  },
  foodName: {
    type: String,
    required: true
  },
  brand: {
    type: String
  },
  category: {
    type: String,
    enum: ['generic-foods', 'packaged-foods', 'generic-meals', 'fast-foods']
  },
  image: {
    type: String
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
  },
  healthLabels: [{
    type: String
  }],
  dietLabels: [{
    type: String
  }],
  allergenLabels: [{
    type: String
  }],
  measures: [{
    uri: String,
    label: String,
    weight: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FoodItem', FoodItemSchema);
