const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    age, 
    gender, 
    height, 
    weight, 
    activityLevel,
    targetWeight,
    allergies,
    dietaryRestrictions,
    healthConditions,
    medications
  } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    age,
    gender,
    height,
    weight,
    activityLevel,
    targetWeight,
    allergies: allergies || [],
    dietaryRestrictions: dietaryRestrictions || [],
    healthConditions: healthConditions || [],
    medications: medications || []
  });

  if (user) {
    // Calculate health metrics
    const bmi = user.calculateBMI();
    const bmr = user.calculateBMR();
    const dailyCalories = user.calculateDailyCalories();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      targetWeight: user.targetWeight,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      healthConditions: user.healthConditions,
      medications: user.medications,
      profilePicture: user.profilePicture,
      healthMetrics: {
        bmi,
        bmr,
        dailyCalories
      },
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Calculate health metrics
    const bmi = user.calculateBMI();
    const bmr = user.calculateBMR();
    const dailyCalories = user.calculateDailyCalories();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      targetWeight: user.targetWeight,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      healthConditions: user.healthConditions,
      medications: user.medications,
      profilePicture: user.profilePicture,
      healthMetrics: {
        bmi,
        bmr,
        dailyCalories
      },
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Calculate health metrics
    const bmi = user.calculateBMI();
    const bmr = user.calculateBMR();
    const dailyCalories = user.calculateDailyCalories();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      targetWeight: user.targetWeight,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      healthConditions: user.healthConditions,
      medications: user.medications,
      profilePicture: user.profilePicture,
      healthMetrics: {
        bmi,
        bmr,
        dailyCalories
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    if (req.body.age) user.age = req.body.age;
    if (req.body.gender) user.gender = req.body.gender;
    if (req.body.height) user.height = req.body.height;
    if (req.body.weight) user.weight = req.body.weight;
    if (req.body.activityLevel) user.activityLevel = req.body.activityLevel;
    if (req.body.targetWeight) user.targetWeight = req.body.targetWeight;
    if (req.body.allergies) user.allergies = req.body.allergies;
    if (req.body.dietaryRestrictions) user.dietaryRestrictions = req.body.dietaryRestrictions;
    if (req.body.healthConditions) user.healthConditions = req.body.healthConditions;
    if (req.body.medications) user.medications = req.body.medications;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

    const updatedUser = await user.save();

    // Calculate health metrics
    const bmi = updatedUser.calculateBMI();
    const bmr = updatedUser.calculateBMR();
    const dailyCalories = updatedUser.calculateDailyCalories();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      height: updatedUser.height,
      weight: updatedUser.weight,
      activityLevel: updatedUser.activityLevel,
      targetWeight: updatedUser.targetWeight,
      allergies: updatedUser.allergies,
      dietaryRestrictions: updatedUser.dietaryRestrictions,
      healthConditions: updatedUser.healthConditions,
      medications: updatedUser.medications,
      profilePicture: updatedUser.profilePicture,
      healthMetrics: {
        bmi,
        bmr,
        dailyCalories
      },
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile
};
