# Boats Trader AI Comparison Tool

This application allows users to analyze boat images and find similar boats based on various matching criteria. It uses React for the front-end interface and implements a sophisticated matching algorithm to provide accurate boat comparisons.

## Features

- Upload and analyze boat images
- Detect boat type, size, and key features
- Find similar boats with match percentage ratings
- Compare boats based on type, length, features, and more
- View detailed match breakdowns

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/boats-group/ai-compare-boats.git
   cd ai-compare-boats
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## How It Works

The application uses a complex matching algorithm that considers several factors when comparing boats:

- Type matching (45% weight): Compares boat types and recognizes similar boat type families
- Length matching (25% weight): Compares boat lengths with a tolerance for different measurement units
- Feature matching (30% weight): Analyzes common features between boats

Match percentages are calculated based on these weighted factors to provide meaningful comparisons.

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App configuration

## Project Structure

- `/src/components`: React components for the UI
- `/src/data`: Sample boat data for testing
- `/src/services`: API and service integrations
- `/src/utils`: Utility functions including matching algorithms
- `/src/models`: Data models and database connections
