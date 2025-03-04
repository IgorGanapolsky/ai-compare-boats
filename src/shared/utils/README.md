# Shared Utilities

This directory contains utility functions and helpers that are used across multiple features in the application.

## Guidelines

1. **Pure Functions**: Utilities should be pure functions whenever possible
2. **No Side Effects**: Avoid side effects in utility functions
3. **Well Tested**: Each utility should have comprehensive tests
4. **Well Documented**: Document all functions with JSDoc comments
5. **Performance Focused**: Utilities should be optimized for performance
6. **Type Safe**: Include TypeScript definitions for all utilities

## Categories

Utilities are organized into categories:

### API Utilities
Functions for working with APIs, handling requests, responses, and errors.

### String Utilities
Functions for manipulating and formatting strings, including name formatting, search term normalization, etc.

### Number Utilities
Functions for numerical operations, including unit conversions, rounding, and formatting.

### Array/Object Utilities
Functions for manipulating arrays and objects, including sorting, filtering, and transformation.

### Date Utilities
Functions for parsing, formatting, and manipulating dates.

### Validation Utilities
Functions for validating data, input, and state.

### Error Handling Utilities
Functions for creating and handling errors in a consistent way.

## Examples

### Error Creation

```jsx
// createError.js
/**
 * Creates a structured error object with consistent format
 * @param {string} message - Human readable error message
 * @param {string} type - Error type for categorization
 * @param {Object} context - Additional context about the error
 * @returns {Object} Structured error object
 */
export const createError = (message, type, context = {}) => ({
  message,
  type,
  timestamp: new Date().toISOString(),
  ...context
});
```

### Data Formatting

```jsx
// formatBoatData.js
/**
 * Formats boat data for display, handling missing fields
 * @param {Object} boat - Raw boat data
 * @returns {Object} Formatted boat data
 */
export const formatBoatData = (boat) => ({
  name: boat.name || 'Unknown Model',
  length: boat.length ? `${boat.length} ft` : 'Length unknown',
  type: formatBoatType(boat.type),
  year: boat.year || 'Year unknown'
});
```
