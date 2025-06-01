const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  height: {
    type: Number,
    required: true,
    comment: 'Height in cm'
  },
  weight: {
    type: Number,
    required: true,
    comment: 'Weight in kg'
  },
  activityLevel: {
    type: String,
    required: true,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
  },
  targetWeight: {
    type: Number
  },
  allergies: [{
    type: String
  }],
  dietaryRestrictions: [{
    type: String
  }],
  healthConditions: [{
    type: String
  }],
  medications: [{
    type: String
  }],
  profilePicture: {
    type: String
  },
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

// Calculate BMI
UserSchema.methods.calculateBMI = function() {
  const heightInMeters = this.height / 100;
  return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
};

// Calculate BMR using Mifflin-St Jeor Equation
UserSchema.methods.calculateBMR = function() {
  if (this.gender === 'male') {
    return (10 * this.weight) + (6.25 * this.height) - (5 * this.age) + 5;
  } else {
    return (10 * this.weight) + (6.25 * this.height) - (5 * this.age) - 161;
  }
};

// Calculate daily caloric needs
UserSchema.methods.calculateDailyCalories = function() {
  const bmr = this.calculateBMR();
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  return Math.round(bmr * activityMultipliers[this.activityLevel]);
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
