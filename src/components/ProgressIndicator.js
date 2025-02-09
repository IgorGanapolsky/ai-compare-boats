import React from 'react';
import './ProgressIndicator.css';

const ProgressIndicator = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-text">
        <span>Analyzing Image</span>
        <span className="progress-percentage">{progress}%</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && (
        <div className="progress-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
