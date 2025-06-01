import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../services/api"; // Import the configured axios instance

const AddMeasurementModal = ({ open, onClose, onMeasurementAdded }) => {
  const [metricType, setMetricType] = useState("weight");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [unit, setUnit] = useState("kg");
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  ); // Default to now, format for datetime-local
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setMetricType("weight");
    setValue("");
    setSystolic("");
    setDiastolic("");
    setUnit("kg");
    setNotes("");
    setTimestamp(new Date().toISOString().slice(0, 16));
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMetricTypeChange = (event) => {
    const newType = event.target.value;
    setMetricType(newType);
    setValue("");
    setSystolic("");
    setDiastolic("");
    // Set default unit based on type
    if (newType === "weight") setUnit("kg");
    else if (newType === "blood_glucose") setUnit("mg/dL");
    else if (newType === "blood_pressure") setUnit("mmHg");
    else setUnit("");
  };

  const handleSubmit = async () => {
    setError(""); // Clear previous errors
    let measurementData = {};
    let isValid = true;

    // Basic Validation
    if (!metricType) {
      setError("Please select a metric type.");
      isValid = false;
    }

    if (metricType === "blood_pressure") {
      if (!systolic || isNaN(systolic) || systolic <= 0) {
        setError("Please enter a valid systolic pressure.");
        isValid = false;
      }
      if (!diastolic || isNaN(diastolic) || diastolic <= 0) {
        setError("Please enter a valid diastolic pressure.");
        isValid = false;
      }
      if (isValid) {
        measurementData = {
          type: metricType,
          value: { systolic: Number(systolic), diastolic: Number(diastolic) },
          unit: unit,
          notes: notes,
          timestamp: new Date(timestamp).toISOString(), // Ensure ISO format
        };
      }
    } else {
      if (!value || isNaN(value) || value <= 0) {
        setError(`Please enter a valid ${metricType} value.`);
        isValid = false;
      }
      if (isValid) {
        measurementData = {
          type: metricType,
          value: Number(value),
          unit: unit,
          notes: notes,
          timestamp: new Date(timestamp).toISOString(), // Ensure ISO format
        };
      }
    }

    if (!isValid) return;

    setLoading(true);
    try {
      await api.post("/health", measurementData);
      onMeasurementAdded(); // Callback to refresh dashboard data
      handleClose(); // Close modal on success
    } catch (err) {
      console.error("Error adding measurement:", err);
      setError(err.response?.data?.message || "Failed to save measurement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Health Measurement</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              required
              fullWidth
              label="Metric Type"
              value={metricType}
              onChange={handleMetricTypeChange}
            >
              <MenuItem value="weight">Weight</MenuItem>
              <MenuItem value="blood_pressure">Blood Pressure</MenuItem>
              <MenuItem value="blood_glucose">Blood Glucose</MenuItem>
              {/* Add other types if needed */}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {metricType === "blood_pressure" ? (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Systolic (mmHg)"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Diastolic (mmHg)"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled // Unit is usually fixed per type
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={handleClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Save Measurement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMeasurementModal;

