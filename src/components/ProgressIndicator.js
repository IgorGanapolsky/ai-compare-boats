import React from 'react';
import './ProgressIndicator.css';

const ProgressIndicator = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-title">Analyzing Image</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && (
        <div className="progress-message">{message}</div>
      )}
    </div>
  );
};

export default ProgressIndicator;
