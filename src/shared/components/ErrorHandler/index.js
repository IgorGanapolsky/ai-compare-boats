import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import { OPENAI_ERROR_TYPES } from '../../../services/openaiService';
import { ERROR_TYPES } from '../../../utils/boatMatching';

/**
 * Error Handler component to display user-friendly error messages
 * and provide potential solutions
 */
const ErrorHandler = ({ 
  errors, 
  onRetry, 
  onDismiss, 
  showDetails, 
  onToggleDetails 
}) => {
  if (!errors || errors.length === 0) return null;

  // Group errors by type for better organization
  const errorsByType = errors.reduce((acc, error) => {
    const type = error.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(error);
    return acc;
  }, {});

  // Get a user-friendly message for each error type
  const getFriendlyMessage = (errorType) => {
    // Check OpenAI error types first
    switch (errorType) {
      case OPENAI_ERROR_TYPES.RATE_LIMIT_ERROR:
        return "We've hit OpenAI's rate limit. Please try again in a few minutes.";
      case OPENAI_ERROR_TYPES.AUTH_ERROR:
        return "Authentication error with OpenAI. Please check your API key.";
      case OPENAI_ERROR_TYPES.TIMEOUT_ERROR:
        return "The request to OpenAI timed out. Please try again.";
      case OPENAI_ERROR_TYPES.CONNECTION_ERROR:
        return "Connection error. Please check your internet connection.";
      case OPENAI_ERROR_TYPES.SERVER_ERROR:
        return "OpenAI servers are experiencing issues. Please try again later.";
      case OPENAI_ERROR_TYPES.INVALID_REQUEST:
        return "Invalid request to OpenAI. This might be an issue with the image format.";
        
      // Check boat matching error types
      case ERROR_TYPES.API_UNAVAILABLE:
        return "The AI service is temporarily unavailable. Using fallback matching.";
      case ERROR_TYPES.API_RATE_LIMIT:
        return "API rate limit exceeded. Some matches may use fallback algorithms.";
      case ERROR_TYPES.API_TOKEN_INVALID:
        return "Invalid API token. Please check your configuration.";
      case ERROR_TYPES.DATA_INCOMPLETE:
        return "Some boat data is incomplete. Matching may be less accurate.";
      case ERROR_TYPES.TYPE_MISMATCH:
        return "Boat type comparison issue. Falling back to basic matching.";
      
      // Default fallback
      default:
        return "An error occurred during processing. Some features may be limited.";
    }
  };

  // Get suggested action for each error type
  const getSuggestedAction = (errorType) => {
    switch (errorType) {
      case OPENAI_ERROR_TYPES.RATE_LIMIT_ERROR:
      case ERROR_TYPES.API_RATE_LIMIT:
        return "Wait a few minutes and try again";
        
      case OPENAI_ERROR_TYPES.AUTH_ERROR:
      case OPENAI_ERROR_TYPES.INVALID_REQUEST:
      case ERROR_TYPES.API_TOKEN_INVALID:
        return "Check API configuration";
        
      case OPENAI_ERROR_TYPES.TIMEOUT_ERROR:
      case OPENAI_ERROR_TYPES.CONNECTION_ERROR:
      case OPENAI_ERROR_TYPES.SERVER_ERROR:
      case ERROR_TYPES.API_UNAVAILABLE:
        return "Try again later";
        
      case ERROR_TYPES.DATA_INCOMPLETE:
      case ERROR_TYPES.TYPE_MISMATCH:
        return "Consider updating boat data";
        
      default:
        return "Try again or contact support";
    }
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <h3>
          {errors.length === 1 
            ? "An issue occurred" 
            : `${errors.length} issues occurred`}
        </h3>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className={styles.dismissButton}
            aria-label="Dismiss error message"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className={styles.errorContent}>
        {Object.keys(errorsByType).map((errorType) => (
          <div key={errorType} className={styles.errorTypeGroup}>
            <div className={styles.errorSummary}>
              <p className={styles.errorMessage}>
                {getFriendlyMessage(errorType)}
              </p>
              <p className={styles.errorAction}>
                <strong>Suggestion:</strong> {getSuggestedAction(errorType)}
              </p>
            </div>
          </div>
        ))}
        
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton}>
            Try Again
          </button>
        )}
        
        {errors.length > 0 && (
          <button 
            onClick={onToggleDetails} 
            className={styles.detailsToggle}
          >
            {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>
        )}
        
        {showDetails && (
          <div className={styles.errorDetails}>
            {errors.map((error, index) => (
              <div key={index} className={styles.errorDetail}>
                <p><strong>Error:</strong> {error.message || 'Unknown error'}</p>
                {error.boatName && <p><strong>Boat:</strong> {error.boatName}</p>}
                {error.type && <p><strong>Type:</strong> {error.type}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ErrorHandler.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string,
      type: PropTypes.string,
      boatName: PropTypes.string,
      boatId: PropTypes.string
    })
  ).isRequired,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  showDetails: PropTypes.bool,
  onToggleDetails: PropTypes.func.isRequired
};

ErrorHandler.defaultProps = {
  showDetails: false
};

export default ErrorHandler;
