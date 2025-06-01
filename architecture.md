# WhichFood Application Architecture

This document outlines the comprehensive architecture for the WhichFood application, detailing both the frontend and backend components, their interactions, and the overall system design.

## 1. System Overview

The WhichFood application is designed as a full-stack web application with a React frontend and Node.js backend. The system follows a modern microservices architecture to ensure modularity, scalability, and maintainability. The application enables users to manage their dietary habits, track health metrics, and receive personalized food recommendations based on their health profiles.

## 2. High-Level Architecture

The WhichFood application architecture consists of the following major components:

### 2.1 Client Layer
- React-based single-page application (SPA)
- Progressive Web App (PWA) capabilities for offline functionality
- Responsive design for desktop and mobile devices

### 2.2 API Gateway Layer
- Express.js-based RESTful API gateway
- Authentication and authorization middleware
- Request validation and rate limiting

### 2.3 Service Layer
- User Profile Service
- Health Monitoring Service
- Meal Logging Service
- Recommendation Service

### 2.4 Data Layer
- MongoDB for user profiles and health data
- Redis for caching and session management
- External APIs for food database and nutritional information

## 3. Frontend Architecture (React)

### 3.1 Component Structure

The React frontend follows a component-based architecture with the following organization:

#### 3.1.1 Core Components
- **App**: The root component that handles routing and global state
- **Layout**: Contains header, footer, and navigation components
- **AuthProvider**: Manages authentication state and user sessions
- **ThemeProvider**: Handles application theming and styling

#### 3.1.2 Feature Components
- **User Profile Module**:
  - Registration and login forms
  - Profile creation and editing interfaces
  - Health metrics display
  - Goal setting components
  
- **Health Monitoring Module**:
  - Health metric input forms
  - Visualization components (charts, graphs)
  - Alert notification components
  - Correlation analysis displays
  
- **Meal Logging Module**:
  - Food search and selection interfaces
  - Barcode scanning component
  - Meal history and favorites
  - Nutritional breakdown displays
  
- **Recommendation Module**:
  - Personalized food suggestion components
  - Meal planning interfaces
  - Alternative food recommendation displays

#### 3.1.3 Shared Components
- Form elements (inputs, buttons, selectors)
- Modal and dialog components
- Loading and error states
- Toast notifications
- Data visualization components

### 3.2 State Management

The application will use a combination of state management approaches:

- **React Context API**: For global application state (user authentication, theme preferences)
- **Redux**: For complex state management across multiple components
- **React Query**: For server state management, caching, and data fetching

### 3.3 Routing

React Router will handle client-side routing with the following main routes:

- `/`: Home/Dashboard
- `/auth`: Authentication (login/register)
- `/profile`: User profile management
- `/health`: Health monitoring dashboard
- `/meals`: Meal logging and history
- `/recommendations`: Food recommendations
- `/settings`: Application settings

### 3.4 Styling Approach

The application will use a modern styling approach with:

- Styled Components for component-specific styling
- CSS variables for theming and consistent design
- Responsive design principles for mobile compatibility
- Accessibility-focused styling following WCAG guidelines

## 4. Backend Architecture (Node.js)

### 4.1 API Gateway

The Express.js-based API gateway serves as the entry point for all client requests and handles:

- Request routing to appropriate microservices
- Authentication and authorization
- Request validation
- Rate limiting and security measures
- CORS configuration
- Error handling and logging

### 4.2 Microservices

#### 4.2.1 User Profile Service
- User registration and authentication
- Profile CRUD operations
- Health metrics calculation
- Goal management
- Data export functionality

#### 4.2.2 Health Monitoring Service
- Health metric tracking
- Data visualization processing
- Alert generation
- Correlation analysis
- Integration with health devices

#### 4.2.3 Meal Logging Service
- Food item database management
- Meal logging and history
- Nutritional analysis
- Barcode scanning processing
- Meal template management

#### 4.2.4 Recommendation Service
- Personalized food recommendations
- Nutritional need analysis
- Dietary restriction processing
- Machine learning models for recommendation improvement
- Seasonal food suggestions

### 4.3 Data Models

#### 4.3.1 User Model
- Authentication information
- Personal details
- Health profile
- Preferences and settings
- Goal information

#### 4.3.2 Health Metrics Model
- Various health measurements
- Timestamps
- Reference ranges
- Notes and context

#### 4.3.3 Food Item Model
- Nutritional information
- Categories and tags
- Portion information
- Source and reliability rating

#### 4.3.4 Meal Log Model
- Food items and quantities
- Timestamp and meal category
- Nutritional totals
- User notes

### 4.4 Database Design

The application uses a polyglot persistence approach:

- **MongoDB**: Primary database for user profiles, health data, and meal logs
  - Provides flexibility for varying data structures
  - Supports horizontal scaling for growing user base
  - Enables efficient document-based queries

- **Redis**:
  - Session management
  - Caching frequently accessed data
  - Real-time notifications
  - Rate limiting implementation

### 4.5 External API Integrations

The backend will integrate with several external services:

- **Food Database APIs**: For comprehensive nutritional information
- **Health Device APIs**: For automated health metric collection
- **Authentication Providers**: For social login options
- **Email Service**: For notifications and alerts
- **Image Storage**: For food and profile images

## 5. Security Architecture

### 5.1 Authentication and Authorization

- JWT-based authentication
- Role-based access control
- OAuth integration for social login
- Multi-factor authentication support
- Session management with secure cookies

### 5.2 Data Protection

- HTTPS for all communications
- Data encryption at rest
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)
- Rate limiting to prevent abuse

### 5.3 Privacy Considerations

- GDPR and HIPAA compliance measures
- User consent management
- Data minimization principles
- Anonymization for analytics
- Clear privacy policies and user controls

## 6. Deployment Architecture

### 6.1 Development Environment

- Local development with Docker containers
- Development database instances
- Mock external services for testing
- Hot reloading for efficient development

### 6.2 Production Environment

- Cloud-based deployment (AWS/Azure/GCP)
- Container orchestration with Kubernetes
- Load balancing for high availability
- Auto-scaling based on demand
- CDN for static assets

### 6.3 CI/CD Pipeline

- Automated testing on commit
- Staging environment for pre-production validation
- Blue-green deployment strategy
- Automated rollback capabilities
- Continuous monitoring and alerting

## 7. Cross-Cutting Concerns

### 7.1 Logging and Monitoring

- Centralized logging system
- Performance monitoring
- Error tracking and alerting
- User activity auditing
- System health dashboards

### 7.2 Caching Strategy

- Browser caching for static assets
- API response caching
- Database query caching
- Distributed caching for scalability

### 7.3 Internationalization

- Multi-language support
- Localized formatting (dates, numbers)
- Cultural considerations in food recommendations
- Regional measurement units

## 8. Component Interaction Diagrams

### 8.1 User Registration Flow

1. User enters registration details in React form
2. Frontend validates input and sends to API Gateway
3. API Gateway routes to User Profile Service
4. User Profile Service validates and creates user record
5. JWT token generated and returned to client
6. Frontend stores token and redirects to profile completion

### 8.2 Health Metric Logging Flow

1. User enters health metric in React form
2. Frontend validates and sends to API Gateway
3. API Gateway routes to Health Monitoring Service
4. Health Monitoring Service stores metric and analyzes for alerts
5. If alert conditions met, notification generated
6. Updated health data returned to frontend
7. Frontend updates visualization components

### 8.3 Meal Logging Flow

1. User searches for food item or scans barcode
2. Frontend sends search/scan data to API Gateway
3. API Gateway routes to Meal Logging Service
4. Meal Logging Service queries food database
5. Food options returned to frontend
6. User selects food and portion
7. Frontend calculates preliminary nutritional information
8. User confirms meal entry
9. Meal logged and nutritional totals updated
10. Recommendation Service notified of new meal data

### 8.4 Recommendation Generation Flow

1. User requests recommendations or system triggers scheduled recommendation
2. Frontend sends request with context to API Gateway
3. API Gateway routes to Recommendation Service
4. Recommendation Service retrieves user profile, health data, and meal history
5. Service applies recommendation algorithms based on user needs
6. Personalized recommendations generated
7. Results returned to frontend
8. Frontend displays recommendations with interactive options

## 9. Technology Stack

### 9.1 Frontend Technologies

- **Core Framework**: React 18+
- **State Management**: Redux Toolkit, React Query
- **Routing**: React Router 6+
- **Styling**: Styled Components, CSS Modules
- **UI Components**: Custom component library with accessibility focus
- **Data Visualization**: D3.js, Chart.js
- **Testing**: Jest, React Testing Library
- **Build Tools**: Vite, ESBuild

### 9.2 Backend Technologies

- **Runtime**: Node.js 18+
- **API Framework**: Express.js
- **Authentication**: Passport.js, JWT
- **Validation**: Joi, Yup
- **Database Access**: Mongoose (MongoDB), ioredis (Redis)
- **Testing**: Mocha, Chai, Supertest
- **Documentation**: Swagger/OpenAPI

### 9.3 DevOps and Infrastructure

- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## 10. Scalability Considerations

The architecture is designed with scalability in mind:

- Stateless services for horizontal scaling
- Database sharding for data growth
- Caching layers to reduce database load
- Asynchronous processing for compute-intensive tasks
- CDN integration for global content delivery
- Microservices architecture for independent scaling of components

## 11. Future Extensibility

The architecture allows for future extensions:

- Mobile native applications using React Native
- Machine learning enhancements for recommendations
- Integration with additional health devices and services
- Expanded social features and community aspects
- Professional dietitian portal for guided nutrition
- Meal delivery service integrations
