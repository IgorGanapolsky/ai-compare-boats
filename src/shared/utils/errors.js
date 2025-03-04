/**
 * Shared error utilities for consistent error handling across features
 */

/**
 * Error types for better handling and reporting
 */
export const ERROR_TYPES = {
  // API errors
  API_UNAVAILABLE: 'api_unavailable',
  API_RATE_LIMIT: 'api_rate_limit',
  API_TOKEN_INVALID: 'api_token_invalid',
  
  // Data errors
  DATA_INCOMPLETE: 'data_incomplete',
  DATA_INVALID: 'data_invalid',
  TYPE_MISMATCH: 'type_mismatch',
  
  // General errors
  GENERAL_ERROR: 'general_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  USER_ERROR: 'user_error'
};

/**
 * Helper to create a structured error with type
 * @param {string} message Error message
 * @param {string} type Error type from ERROR_TYPES
 * @param {*} originalError Original error if available
 * @param {Object} context Additional context about the error
 * @returns {Error} Enhanced error object
 */
export const createError = (message, type = ERROR_TYPES.GENERAL_ERROR, originalError = null, context = {}) => {
  const error = new Error(message);
  error.type = type;
  error.originalError = originalError;
  error.timestamp = new Date().toISOString();
  error.context = context;
  return error;
};

/**
 * Format an error object into a human-readable message
 * @param {Error} error Error object to format
 * @returns {string} Formatted error message
 */
export const formatError = (error) => {
  if (!error) return 'Unknown error';
  
  let message = error.message || 'An unknown error occurred';
  
  // Add error type if available
  if (error.type) {
    message = `[${error.type}] ${message}`;
  }
  
  // Add context information if available
  if (error.context) {
    const contextStr = Object.entries(error.context)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    message = `${message} (${contextStr})`;
  }
  
  return message;
};

/**
 * Safely handle an async operation with proper error handling
 * @param {Promise} promise Promise to handle
 * @param {Object} errorContext Optional context to add to error
 * @returns {Promise<[data, error]>} Tuple of [data, error]
 */
export const safeAsync = async (promise, errorContext = {}) => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    // Format error if it's not already a structured error
    const formattedError = error.type 
      ? { ...error, context: { ...error.context, ...errorContext } }
      : createError(
          error.message || 'An error occurred', 
          ERROR_TYPES.GENERAL_ERROR, 
          error, 
          errorContext
        );
    
    return [null, formattedError];
  }
};

/**
 * Get a user-friendly message based on error type
 * @param {string} errorType Error type from ERROR_TYPES
 * @returns {string} User-friendly error message
 */
export const getFriendlyErrorMessage = (errorType) => {
  switch (errorType) {
    case ERROR_TYPES.API_UNAVAILABLE:
      return "The service is temporarily unavailable. Using fallback functionality.";
    case ERROR_TYPES.API_RATE_LIMIT:
      return "Rate limit exceeded. Please try again in a few minutes.";
    case ERROR_TYPES.API_TOKEN_INVALID:
      return "Authentication error. Please check your configuration.";
    case ERROR_TYPES.DATA_INCOMPLETE:
      return "Some data is incomplete. Results may be limited.";
    case ERROR_TYPES.DATA_INVALID:
      return "Invalid data format. Please check your inputs.";
    case ERROR_TYPES.NETWORK_ERROR:
      return "Network connection issue. Please check your internet connection.";
    case ERROR_TYPES.TIMEOUT_ERROR:
      return "Request timed out. Please try again.";
    case ERROR_TYPES.USER_ERROR:
      return "There was an issue with your request. Please check your inputs.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};
