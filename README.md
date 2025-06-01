# WhichFood Application - Project Summary

## Project Overview
WhichFood is a full-stack web application designed to help users track their meals, monitor health metrics, and receive personalized food recommendations based on their unique health profile and nutritional needs. The application has been developed using React for the frontend and Node.js with Express for the backend, with integration to the Edamam Food Database API for real nutritional data.

## Key Features Implemented

### User Management
- User registration with comprehensive health profile collection
- Secure authentication and authorization
- Profile management and updates

### Health Monitoring
- Track various health metrics (blood pressure, blood glucose, weight, etc.)
- Visualize health trends over time
- Calculate BMI, BMR, and daily caloric needs

### Meal Logging
- Search and log food items with accurate nutritional information
- Track daily nutrient intake
- View meal history and nutritional summaries

### Food Recommendations
- Personalized food suggestions based on:
  - Nutritional deficiencies
  - Health profile
  - Dietary restrictions and allergies
  - Daily nutritional targets

### Data Visualization
- Interactive charts for health metrics
- Nutritional breakdown visualizations
- Progress tracking toward health goals

## Technical Implementation

### Frontend (React)
- TypeScript for type safety
- Material UI for consistent, responsive design
- React Router for navigation
- Chart.js for data visualization
- Axios for API communication

### Backend (Node.js/Express)
- RESTful API architecture
- MongoDB database with Mongoose ODM
- JWT authentication
- Integration with Edamam Food Database API
- Health calculation algorithms

### Color Palette
A carefully selected color palette has been implemented throughout the application:
- Primary: Green (#4CAF50) - Representing health and nutrition
- Secondary: Orange (#FF9800) - Representing energy and vitality
- Accent colors for specific health metrics and nutritional categories
- Neutral backgrounds for readability and accessibility

## Project Structure

```
foodwhich/
├── frontend/               # React frontend application
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── theme.js        # Color palette and styling
│       └── App.js          # Main application component
│
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Server entry point
│   └── package.json        # Backend dependencies
│
└── documentation/          # Project documentation
    ├── requirements.md     # Functional and non-functional requirements
    ├── architecture.md     # Application architecture
    └── food_data_api.md    # API integration details
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd foodwhich/backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd foodwhich/frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/foodwhich
   JWT_SECRET=your_jwt_secret
   EDAMAM_APP_ID=your_edamam_app_id
   EDAMAM_APP_KEY=your_edamam_app_key
   ```

5. Start the backend server:
   ```
   cd foodwhich/backend
   npm start
   ```

6. Start the frontend development server:
   ```
   cd foodwhich/frontend
   npm start
   ```

7. Access the application at `http://localhost:3000`

## API Integration

The application integrates with the Edamam Food Database API to provide accurate nutritional information. To use this feature:

1. Register for an account at [Edamam Developer Portal](https://developer.edamam.com/)
2. Create a Food Database application to get your App ID and App Key
3. Add these credentials to your backend `.env` file

## Testing

The application has been thoroughly tested for:
- Functional requirements coverage
- User flow validation
- API integration
- Responsive design
- Cross-browser compatibility

## Future Enhancements

Potential future enhancements could include:
- Mobile application version
- Integration with fitness tracking devices
- Meal planning and grocery list generation
- Community features and social sharing
- AI-powered meal suggestions based on user preferences

## Conclusion

The WhichFood application successfully meets all the requirements specified in the SRS and SDD documents. It provides a comprehensive solution for users to track their nutrition, monitor health metrics, and receive personalized food recommendations based on their unique health profile and nutritional needs.
