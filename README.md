# WasteLess

A full-stack food inventory management and recipe recommendation application that helps users reduce food waste through smart tracking and AI-powered recommendations.

## Overview

WasteLess is a comprehensive solution to the common problem of food waste in households. The application lets users scan grocery receipts to automatically track their food inventory, monitor expiration dates, and receive personalized recipe recommendations that prioritize ingredients about to expire. Using advanced AI technologies and graph algorithms, WasteLess helps users make the most of their groceries while minimizing waste.

## Features

AI-Powered Receipt Scanning: Upload photos of grocery receipts to automatically extract and categorize food items
Multi-language Support: Process receipts in both English and Hebrew
Smart Expiration Tracking: Automatic calculation of expiration dates based on food categories
Inventory Management: Comprehensive tracking of all food items with categorization and expiration alerts
Recipe Recommendations: Personalized recipe suggestions based on your current inventory, prioritizing ingredients about to expire
Waste Analytics: Visual statistics and insights about your food waste patterns and consumption habits

## Tech Stack

### Frontend

* React
* TypeScript
* React Query
* React Router
* Shadcn UI components
* Recharts for data visualization

### Backend

* Node.js
* Express
* TypeScript
* MongoDB with Mongoose
* Google Cloud Vision API for OCR
* Google Cloud Translate API for language translation
* Claude API for food item extraction and categorization
* Auth0 for authentication

## Algorithm & Core Technology
### Max Flow Algorithm
The heart of WasteLess is an advanced recommendation system built on the Ford-Fulkerson/Edmonds-Karp maximum flow algorithm. This graph-based approach:

Constructs a Flow Network: Creates a bipartite graph connecting user ingredients to potential recipes
Weights Connections: Assigns weights based on expiration urgency, match quality, and recipe relevance
Calculates Optimal Flow: Uses the max flow algorithm to find the best ingredient-to-recipe matchings
Scores Recipes: Computes comprehensive scores that prioritize using ingredients about to expire

### The implementation includes:

#### Flow network construction with source and sink nodes
#### Edge capacity assignment based on ingredient quantities
#### Flow augmentation through BFS path finding
#### Result ranking with multi-factor scoring including expiry urgency, nutrition balance, and recipe coverage

## Data Flow Architecture

Receipt Processing Pipeline:

Receipt image → Google Vision OCR → Text extraction
(Optional) Hebrew text → Google Translate → English text
Text → Claude API → Structured food items with categories
Structured items → MongoDB → User's purchase history


Inventory Management Flow:

Purchase items → Category-based expiration dates → Inventory database
Daily background process → Update expiration flags → Alert system
User actions (consume, delete) → Inventory updates → Usage statistics


Recipe Recommendation Flow:

Inventory status → Flow network construction → Max flow calculation
Recipe matching → Multi-factor scoring → Personalized recommendations
User preferences (meal type, specific ingredients) → Refined recommendations


Architecture and Design Choices
Frontend Architecture

Component-Based Structure: Organized into reusable components for maintainability
React Query: Used for data fetching, caching, and state management
Multi-step Workflows: Guided user experiences for receipt processing and recipe recommendations
Responsive Design: Mobile-friendly interface for on-the-go inventory management

Backend Architecture

MVC Pattern: Clear separation of concerns with Models, Views, and Controllers
RESTful API: Consistent API design with predictable endpoints
Middleware Authentication: JWT validation through Auth0 middleware
Service Pattern: Dedicated services for complex operations like receipt processing and recipe recommendations

Algorithm Implementation

Graph-based Recommendation: Using max flow for optimal matching between ingredients and recipes
Weighted Optimization: Multi-factor scoring system for recipe relevance
Nutrition Node Enhancement: Additional nodes in the flow network to account for nutritional balance
Adaptive Scoring: Dynamic recipe scoring based on inventory state and expiration urgency

Security and Performance Considerations

JWT Authentication: All protected routes require valid JWT tokens from Auth0
Image Processing Optimization: Efficient handling of receipt images to minimize processing time
Caching Strategy: Intelligent caching of recipe recommendations to reduce computation overhead
Algorithm Efficiency: Optimized max flow implementation with heuristics to handle large inventory datasets

Future Enhancements

Mobile application with camera integration for easier receipt scanning
Advanced analytics with personalized waste reduction goals
Social features to share recipes and waste reduction achievements
Meal planning suggestions based on shopping history and preferences


WasteLess represents a unique intersection of computer vision, natural language processing, and graph theory algorithms applied to the everyday problem of food waste. By making ingredient tracking and recipe suggestions seamless, the application empowers users to make sustainable choices while enjoying their food to the fullest.
