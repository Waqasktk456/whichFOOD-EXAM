import axios from "axios";

// Define the base URL for the backend API
const API_URL = "http://localhost:5000/api"; // Adjust if your backend runs on a different port/host

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage (or context/state management)
    const token = localStorage.getItem("token"); // Assuming token is stored in localStorage

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      console.error("Unauthorized access - 401");
      // Clear token and user data
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Assuming user data is also stored
      // Redirect to login page (use window.location or router history)
       window.location.href ='/login';
    }
    return Promise.reject(error);
  }
);

export default api;

