const mongoose = require('mongoose');

const HealthMetricSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['blood_pressure', 'blood_glucose', 'cholesterol', 'heart_rate', 'weight']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Add validation for different metric types
HealthMetricSchema.pre('save', function(next) {
  switch(this.type) {
    case 'blood_pressure':
      if (!this.value.systolic || !this.value.diastolic) {
        return next(new Error('Blood pressure requires systolic and diastolic values'));
      }
      break;
    case 'blood_glucose':
    case 'cholesterol':
    case 'heart_rate':
    case 'weight':
      if (typeof this.value !== 'number') {
        return next(new Error(`${this.type} value must be a number`));
      }
      break;
    default:
      return next(new Error('Invalid metric type'));
  }
  next();
});

// Method to check if value is within normal range
HealthMetricSchema.methods.isWithinNormalRange = function() {
  const normalRanges = {
    blood_pressure: {
      systolic: { min: 90, max: 120 },
      diastolic: { min: 60, max: 80 }
    },
    blood_glucose: { min: 70, max: 100 }, // mg/dL, fasting
    cholesterol: { min: 0, max: 200 }, // mg/dL, total cholesterol
    heart_rate: { min: 60, max: 100 }, // bpm, resting
    weight: null // depends on individual
  };

  switch(this.type) {
    case 'blood_pressure':
      return (
        this.value.systolic >= normalRanges.blood_pressure.systolic.min &&
        this.value.systolic <= normalRanges.blood_pressure.systolic.max &&
        this.value.diastolic >= normalRanges.blood_pressure.diastolic.min &&
        this.value.diastolic <= normalRanges.blood_pressure.diastolic.max
      );
    case 'blood_glucose':
    case 'cholesterol':
    case 'heart_rate':
      return (
        this.value >= normalRanges[this.type].min &&
        this.value <= normalRanges[this.type].max
      );
    case 'weight':
      return null; // Need user's BMI to determine
    default:
      return null;
  }
};

module.exports = mongoose.model('HealthMetric', HealthMetricSchema);
