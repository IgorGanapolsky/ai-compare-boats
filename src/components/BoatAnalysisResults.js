import React from 'react';
import './BoatAnalysisResults.css';

const BoatAnalysisResults = ({ analysisResults, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="boat-analysis-container loading">
        <div className="loading-spinner">Analyzing boat image...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boat-analysis-container error">
        <div className="error-message">Error analyzing image: {error}</div>
      </div>
    );
  }

  if (!analysisResults) {
    return null;
  }

  const { type, length, engine, hullMaterial, features } = analysisResults;

  // Filter out features that contain "Not visible" or "Not detected"
  const visibleFeatures = features?.filter(feature =>
    !feature.toLowerCase().includes('not visible') &&
    !feature.toLowerCase().includes('not detected')
  ) || [];

  return (
    <div className="boat-analysis-container">
      <h2>Boat Analysis Results</h2>

      <div className="analysis-section">
        <div className="analysis-item">
          <span className="label">Boat Type:</span>
          <span className="value">{type || 'Not detected'}</span>
        </div>

        <div className="analysis-item">
          <span className="label">Length:</span>
          <span className="value">
            {length ? `${length} feet` : 'Not detected'}
          </span>
        </div>

        {engine && !engine.toLowerCase().includes('not detected') && (
          <div className="analysis-item">
            <span className="label">Engine:</span>
            <span className="value">{engine}</span>
          </div>
        )}

        {hullMaterial && !hullMaterial.toLowerCase().includes('not detected') && (
          <div className="analysis-item">
            <span className="label">Hull Material:</span>
            <span className="value">{hullMaterial}</span>
          </div>
        )}
      </div>

      {visibleFeatures.length > 0 && (
        <div className="features-section">
          <h3>Notable Features</h3>
          <ul className="features-list">
            {visibleFeatures.map((feature, index) => (
              <li key={index} className="feature-tag">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BoatAnalysisResults;
