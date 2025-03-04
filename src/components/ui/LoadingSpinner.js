import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enhanced loading spinner component with progress indicator
 * 
 * @param {Object} props Component props
 * @param {string} props.message Message to display during loading
 * @param {number} props.progress Progress percentage (0-100)
 * @returns {JSX.Element} Rendered component
 */
const LoadingSpinner = ({ message, progress }) => (
    <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">
            <p>{message}</p>
            {progress > 0 && progress < 100 && (
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>

        <style jsx>{`
      .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 200px;
        padding: 20px;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      }
      
      .loading-text {
        text-align: center;
      }
      
      .loading-text p {
        margin: 0 0 5px 0;
        color: #555;
      }
      
      .progress-bar-container {
        width: 200px;
        background-color: #e0e0e0;
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
      }
      
      .progress-bar-fill {
        background-color: #3498db;
        height: 100%;
        transition: width 0.3s ease;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

LoadingSpinner.propTypes = {
    message: PropTypes.string.isRequired,
    progress: PropTypes.number
};

LoadingSpinner.defaultProps = {
    progress: 0
};

export default LoadingSpinner; 