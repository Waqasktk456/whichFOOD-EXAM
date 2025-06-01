# WhichFood Application Requirements

This document compiles all functional and non-functional requirements extracted from the SRS and SDD documents for the WhichFood application.

## Functional Requirements

### 1. User Profile Management Module

#### User Registration and Authentication
- User registration with email address and password
- Email format and password strength validation
- Email verification through confirmation links
- Social media authentication options
- Prevention of duplicate account creation
- Secure user authentication
- Support for multi-factor authentication
- Password recovery functionality
- Account locking after multiple failed login attempts
- Session security with appropriate timeout periods

#### Profile Creation and Management
- Collection of mandatory information: full name, age/date of birth, gender, height, current weight, activity level
- Collection of optional information: target weight, food allergies and intolerances, dietary restrictions, health conditions, medication that may impact nutrition
- Input data validation for reasonable ranges
- Profile information updates
- Weight change history maintenance
- Privacy preferences for data sharing
- Account deactivation
- Data export in standard format
- Profile picture upload

#### Health Metrics Calculation
- Automatic Body Mass Index (BMI) calculation
- Basal Metabolic Rate (BMR) calculation
- Daily caloric needs calculation based on activity level
- Recalculation of metrics when relevant profile data changes
- Interpretation of metrics (e.g., BMI category)

#### Goal Setting
- Weight goal setting
- Health metric goals (blood pressure, blood sugar, etc.)
- Target date calculation based on healthy rates of change
- Goal modification
- Realistic recommendations for goal setting

### 2. Health Monitoring Module

#### Health Metric Tracking
- Support for tracking health metrics: blood pressure, blood glucose levels, cholesterol levels, heart rate, weight
- Manual entry of health metrics
- Integration with health monitoring devices
- Timestamp storage with each measurement
- Validation of entered values against reasonable ranges
- Notes addition to measurements

#### Health Data Visualization
- Graphical representations of health metrics over time
- Display of reference ranges on visualizations
- Selection of different time periods (day, week, month, year)
- Comparison of multiple metrics on the same timeline
- Export of visualization data
- Statistical summaries (averages, trends)

#### Alert System
- Monitoring of entered health metrics for values outside normal ranges
- Alert generation for potentially dangerous health readings
- User notification of persistent negative trends in health metrics
- Customizable alert thresholds
- Clear explanations with alerts
- Suggested appropriate actions in response to alerts

#### Correlation Analysis
- Analysis of relationships between dietary choices and health metrics
- Identification of potential food triggers for health issues
- Visualization of correlations
- Recommendations based on identified correlations
- Historical correlation data storage
- Correlation strength indication

### 3. Meal Logging and Recommendation Module

#### Meal Logging
- Food item search and selection
- Barcode scanning for packaged foods
- Manual entry of custom food items
- Portion size specification
- Meal categorization (breakfast, lunch, dinner, snack)
- Timestamp recording for meals
- Favorite meals saving
- Common meal combinations saving as templates
- Meal history viewing and editing

#### Nutritional Analysis
- Calorie calculation for logged meals
- Macronutrient breakdown (protein, carbohydrates, fat)
- Micronutrient tracking (vitamins, minerals)
- Daily nutritional summary
- Comparison with recommended daily allowances
- Nutritional goal progress tracking
- Identification of nutritional deficiencies or excesses

#### Food Recommendation
- Personalized meal suggestions based on health profile
- Alternative food suggestions for allergies or intolerances
- Recommendations for nutritional balance
- Meal suggestions based on caloric goals
- Consideration of dietary preferences and restrictions
- Seasonal food recommendations
- Recommendation of foods to address specific nutritional needs

## Non-Functional Requirements

### 1. Performance Requirements
- Response time for user interactions under 2 seconds
- Support for concurrent users (minimum 1000)
- Mobile application startup time under 3 seconds
- Database query optimization for large datasets
- Efficient handling of image uploads and processing
- Minimal battery consumption on mobile devices
- Graceful degradation under heavy load

### 2. Safety Requirements
- Clear warnings for potentially harmful dietary choices
- Verification prompts for unusual health metric entries
- Disclaimer for medical advice limitations
- Emergency contact information accessibility
- Clear indication of data source reliability
- Warning system for dangerous health metric combinations
- Guidance for seeking professional medical help when appropriate

### 3. Security Requirements
- HIPAA/GDPR compliance for health data
- Secure data transmission using TLS/SSL
- Encrypted storage of sensitive user information
- Role-based access control
- Regular security audits
- Protection against common web vulnerabilities
- Secure API access with token-based authentication
- Data breach notification procedures
- Secure password storage using strong hashing algorithms
- Session timeout after period of inactivity

### 4. Software Quality Attributes
- Usability: Intuitive interface requiring minimal training
- Reliability: System availability of 99.9%
- Maintainability: Modular design for easy updates
- Portability: Cross-platform compatibility
- Scalability: Ability to handle growing user base
- Interoperability: Standard APIs for third-party integration
- Accessibility: WCAG 2.1 compliance
- Localization: Support for multiple languages and regional units
- Testability: Comprehensive test coverage

### 5. Technical Constraints
- Web application compatibility with latest Chrome, Firefox, Edge browsers
- Mobile application compatibility with Android 10+ and iOS 13+
- Server deployment on cloud-based Linux environment
- Responsive design for various screen sizes
- Offline functionality for core features
- Bandwidth optimization for mobile data usage
- Cross-browser compatibility
- Device sensor access for relevant features

## User Interface Requirements

### 1. General UI Requirements
- Consistent design language across all screens
- Responsive interface adapted to different screen sizes
- WCAG 2.1 accessibility standards compliance
- Consistent color coding for health status indicators
- Clear navigation between modules

### 2. User Profile Management Interfaces
- Simple and intuitive registration and login screens
- Step-by-step wizard approach for profile creation
- Current values display in editable form fields for profile editing
- Clear error messages positioned near relevant fields
- Confirmation messages after successful actions
- Visually distinctive health calculation results

### 3. Health Monitoring Interfaces
- Health metric entry forms with appropriate input validation
- Appropriate chart types for health visualization
- Interactive elements in visualization (zoom, tooltips)
- Visually distinctive and clearly prioritized alert notifications
- Intuitive visual representations for correlation analyses
- Clear indication of reference ranges on all health data displays

## Hardware and Software Interfaces

### 1. Hardware Interfaces
- Integration with smartphone step counters
- Camera integration for barcode scanning
- Interface with Bluetooth-enabled health devices (blood pressure monitors, glucose monitors, smart scales)
- Support for standardized protocols for health device data transfer
- Compatibility with standard cloud computing infrastructure

### 2. Software Interfaces
- Compatibility with current versions of Windows, macOS, and Linux
- Compatibility with current versions of iOS and Android
- Interface with OAuth providers for social login
- Interface with email service providers
- Interface with nutritional databases
- Support for health data standards (HL7 FHIR, Apple HealthKit, Google Fit)
- Inter-module communication interfaces

### 3. Communication Interfaces
- HTTPS for all client-server communications
- WebSockets for real-time notifications
- REST architecture for API endpoints
- JSON for data exchange
- Rate limiting on API endpoints
- Authentication in all API requests
- Support for email, push, and SMS notifications
