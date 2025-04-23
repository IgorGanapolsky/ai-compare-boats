# Boats.com Image Analysis & Comparison

A modern React application for analyzing and comparing boat images using AI vision technology.

## Overview

This application allows users to:
- Upload boat images for analysis
- Receive AI-powered visual analysis of boat features
- Compare similar boats based on visual characteristics
- View detailed feature comparisons between selected boats

## Technologies

- **React 18** with modern hooks pattern
- **TypeScript** for type safety
- **CSS Modules** for component-scoped styling
- **AI Vision API** for image analysis (GPT-4o)

## Architecture

The application follows modern React best practices for 2025:

### Component Architecture

- **Atomic Design Pattern**: Components are organized from atoms to organisms
- **Composition Over Inheritance**: Using component composition for sharing functionality
- **Custom Hooks**: Business logic is extracted into reusable custom hooks
- **Container/Presenter Pattern**: Separation of data fetching from presentation

### State Management

- **React Query**: For server state management with caching
- **Context + Hooks**: For global client state without boilerplate
- **Immutable State Updates**: All state updates follow immutability principles

### Performance Optimizations

- **Code Splitting**: Dynamic imports for route-based code splitting
- **Memoization**: Strategic use of `useMemo` and `useCallback` for expensive operations
- **Virtualization**: For rendering large lists efficiently

## Development Practices

- **TypeScript**: Strict type checking enabled
- **ESLint & Prettier**: Enforced code styling
- **Error Boundaries**: Graceful error handling throughout the app
- **Suspense**: For loading states with fallbacks
- **Accessibility**: ARIA attributes and keyboard navigation

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- Yarn 1.22.0 or higher (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorGanapolsky/ai-compare-boats.git

# Navigate to the project directory
cd ai-compare-boats

# Install dependencies
yarn install

# Start the development server
yarn start
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_BASE_URL=https://your-api-endpoint.com
REACT_APP_OPENAI_API_KEY=your-openai-api-key
```

## Project Structure

```
src/
├── components/         # UI components
│   ├── ui/             # Shared UI components
│   ├── SimilarBoats/   # Boat comparison components
│   └── DetailedComparison/ # Detailed feature comparison
├── features/           # Feature-based components and logic
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── shared/             # Shared utilities and components
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Shared Packages

This project uses the following locally linked packages:

- **@boats/core**: Core business logic and utilities
- **@boats/hooks**: React hooks for boat comparison and analysis
- **@boats/api**: API client services
- **@boats/types**: Shared TypeScript types

These packages are located in the `../boats-packages/packages/` directory and are maintained separately to enable code sharing across multiple Boats.com applications.

## Key Features

### Image Analysis

The application uses GPT-4o vision capabilities to analyze boat images and extract key features, allowing for AI-powered comparison between different boat models.

### Feature Comparison

Detailed comparison between boats showing:
- Common features between boats
- Unique features for each boat
- Match percentage based on feature similarity

### User Experience

- Responsive design for all device sizes
- Progressive loading with visual feedback
- Graceful error handling with fallbacks
- Accessible UI components

## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
