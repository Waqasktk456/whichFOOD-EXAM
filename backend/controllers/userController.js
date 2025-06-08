const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const HealthMetric = require('../models/HealthMetric');
const generateToken = require('../utils/generateToken');

const registerUser = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    age, 
    gender, 
    height, 
    weight,
    bloodPressure,
    bloodGlucose,
    activityLevel,
    targetWeight,
    allergies,
    dietaryRestrictions,
    healthConditions,
    medications
  } = req.body;

  console.log('Received req.body:', JSON.stringify(req.body, null, 2));

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    age,
    gender,
    height,
    weight,
    bloodPressure: bloodPressure && bloodPressure.systolic && bloodPressure.diastolic ? {
      systolic: Number(bloodPressure.systolic),
      diastolic: Number(bloodPressure.diastolic)
    } : null,
    bloodGlucose: bloodGlucose && !isNaN(bloodGlucose) ? Number(bloodGlucose) : null,
    activityLevel,
    targetWeight: targetWeight && !isNaN(targetWeight) ? Number(targetWeight) : null,
    allergies: allergies && Array.isArray(allergies) ? allergies : [],
    dietaryRestrictions: dietaryRestrictions && Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
    healthConditions: healthConditions && Array.isArray(healthConditions) ? healthConditions : [],
    medications: medications && Array.isArray(medications) ? medications : []
  });

  console.log('Created user:', JSON.stringify(user.toObject(), null, 2));

  if (user) {
    // Save health metrics
    if (bloodPressure?.systolic && bloodPressure?.diastolic && !isNaN(bloodPressure.systolic) && !isNaN(bloodPressure.diastolic)) {
      await HealthMetric.create({
        user: user._id,
        type: 'blood_pressure',
        value: { systolic: Number(bloodPressure.systolic), diastolic: Number(bloodPressure.diastolic) },
        unit: 'mmHg',
        timestamp: new Date(),
      });
    }
    if (bloodGlucose && !isNaN(bloodGlucose)) {
      await HealthMetric.create({
        user: user._id,
        type: 'blood_glucose',
        value: Number(bloodGlucose),
        unit: 'mg/dL',
        timestamp: new Date(),
      });
    }
    if (weight && !isNaN(weight)) {
      await HealthMetric.create({
        user: user._id,
        type: 'weight',
        value: Number(weight),
        unit: 'kg',
        timestamp: new Date(),
      });
    }

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
      bloodPressure: user.bloodPressure,
      bloodGlucose: user.bloodGlucose,
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

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
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
      bloodPressure: user.bloodPressure,
      bloodGlucose: user.bloodGlucose,
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

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
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
      bloodPressure: user.bloodPressure,
      bloodGlucose: user.bloodGlucose,
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
    if (req.body.bloodPressure && req.body.bloodPressure.systolic && req.body.bloodPressure.diastolic) {
      user.bloodPressure = {
        systolic: Number(req.body.bloodPressure.systolic),
        diastolic: Number(req.body.bloodPressure.diastolic)
      };
    }
    if (req.body.bloodGlucose && !isNaN(req.body.bloodGlucose)) {
      user.bloodGlucose = Number(req.body.bloodGlucose);
    }
    if (req.body.activityLevel) user.activityLevel = req.body.activityLevel;
    if (req.body.targetWeight) user.targetWeight = Number(req.body.targetWeight);
    if (req.body.allergies) user.allergies = req.body.allergies;
    if (req.body.dietaryRestrictions) user.dietaryRestrictions = req.body.dietaryRestrictions;
    if (req.body.healthConditions) user.healthConditions = req.body.healthConditions;
    if (req.body.medications) user.medications = req.body.medications;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

    const updatedUser = await user.save();

    // Save health metrics
    if (req.body.bloodPressure?.systolic && req.body.bloodPressure?.diastolic && !isNaN(req.body.bloodPressure.systolic) && !isNaN(req.body.bloodPressure.diastolic)) {
      await HealthMetric.create({
        user: user._id,
        type: 'blood_pressure',
        value: { systolic: Number(req.body.bloodPressure.systolic), diastolic: Number(req.body.bloodPressure.diastolic) },
        unit: 'mmHg',
        timestamp: new Date(),
      });
    }
    if (req.body.bloodGlucose && !isNaN(req.body.bloodGlucose)) {
      await HealthMetric.create({
        user: user._id,
        type: 'blood_glucose',
        value: Number(req.body.bloodGlucose),
        unit: 'mg/dL',
        timestamp: new Date(),
      });
    }
    if (req.body.weight && !isNaN(req.body.weight)) {
      await HealthMetric.create({
        user: user._id,
        type: 'weight',
        value: Number(req.body.weight),
        unit: 'kg',
        timestamp: new Date(),
      });
    }

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
      bloodPressure: updatedUser.bloodPressure,
      bloodGlucose: updatedUser.bloodGlucose,
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