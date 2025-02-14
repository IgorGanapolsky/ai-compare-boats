import React from 'react';
import './ProgressIndicator.css';

const ProgressIndicator = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-message">{message}</div>
    </div>
  );
};

export default ProgressIndicator;
