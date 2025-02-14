import React from 'react';
import './ProgressIndicator.css';

const ProgressIndicator = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-content">
        <div className="progress-message">
          <span>Analyzing Image</span>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        {message && (
          <div className="status-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;
