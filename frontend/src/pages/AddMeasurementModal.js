import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, FormHelperText } from '@mui/material';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const AddMeasurementModal = ({ open, onClose, onMeasurementAdded }) => {
  const [formData, setFormData] = useState({
    type: '',
    value: '',
    systolic: '',
    diastolic: '',
    unit: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Metric type is required';
    if (formData.type === 'blood_pressure') {
      if (!formData.systolic) newErrors.systolic = 'Systolic value is required';
      else if (isNaN(formData.systolic) || formData.systolic < 50 || formData.systolic > 250)
        newErrors.systolic = 'Systolic must be between 50 and 250 mmHg';
      if (!formData.diastolic) newErrors.diastolic = 'Diastolic value is required';
      else if (isNaN(formData.diastolic) || formData.diastolic < 30 || formData.diastolic > 150)
        newErrors.diastolic = 'Diastolic must be between 30 and 150 mmHg';
    } else {
      if (!formData.value) newErrors.value = 'Value is required';
      else if (isNaN(formData.value)) newErrors.value = 'Value must be a number';
      if (formData.type === 'blood_glucose' && (formData.value < 20 || formData.value > 500))
        newErrors.value = 'Blood glucose must be between 20 and 500 mg/dL';
      if (formData.type === 'weight' && (formData.value < 30 || formData.value > 300))
        newErrors.value = 'Weight must be between 30 and 300 kg';
    }
    if (!formData.unit && formData.type !== 'blood_pressure') newErrors.unit = 'Unit is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        type: formData.type,
        value: formData.type === 'blood_pressure' ? { systolic: Number(formData.systolic), diastolic: Number(formData.diastolic) } : Number(formData.value),
        unit: formData.type === 'blood_pressure' ? 'mmHg' : formData.unit,
        notes: formData.notes,
        timestamp: new Date(),
      };

      // Save to HealthMetric
      await axios.post('http://localhost:5000/api/health', requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update User profile
      const updateData = {};
      if (formData.type === 'blood_pressure') {
        updateData.bloodPressure = requestData.value;
      } else if (formData.type === 'blood_glucose') {
        updateData.bloodGlucose = requestData.value;
      } else if (formData.type === 'weight') {
        updateData.weight = requestData.value;
      }

      if (Object.keys(updateData).length > 0) {
        await axios.put('http://localhost:5000/api/users/profile', updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onMeasurementAdded();
      onClose();
      setFormData({ type: '', value: '', systolic: '', diastolic: '', unit: '', notes: '' });
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Failed to add measurement' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Add Health Measurement
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.type}>
            <InputLabel id="type-label">Metric Type</InputLabel>
            <Select
              labelId="type-label"
              name="type"
              value={formData.type}
              label="Metric Type"
              onChange={handleChange}
            >
              <MenuItem value="blood_pressure">Blood Pressure</MenuItem>
              <MenuItem value="blood_glucose">Blood Glucose</MenuItem>
              <MenuItem value="weight">Weight</MenuItem>
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>

          {formData.type === 'blood_pressure' ? (
            <>
              <TextField
                fullWidth
                label="Systolic (mmHg)"
                name="systolic"
                type="number"
                value={formData.systolic}
                onChange={handleChange}
                error={!!errors.systolic}
                helperText={errors.systolic}
                sx={{ mb: 2 }}
                inputProps={{ min: 50, max: 250 }}
              />
              <TextField
                fullWidth
                label="Diastolic (mmHg)"
                name="diastolic"
                type="number"
                value={formData.diastolic}
                onChange={handleChange}
                error={!!errors.diastolic}
                helperText={errors.diastolic}
                sx={{ mb: 2 }}
                inputProps={{ min: 30, max: 150 }}
              />
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="Value"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                error={!!errors.value}
                helperText={errors.value}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                error={!!errors.unit}
                helperText={errors.unit}
                sx={{ mb: 2 }}
              />
            </>
          )}

          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {errors.submit && (
            <Typography color="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Add Measurement
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddMeasurementModal;