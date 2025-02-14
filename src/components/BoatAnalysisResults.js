import React from 'react';
import './BoatAnalysisResults.css';

const BoatAnalysisResults = ({ results, onReset }) => {
  if (!results) {
    return null;
  }

  const {
    detectedType = 'Not detected',
    engineType = 'Not detected',
    estimatedSize = 'Not detected',
    keyFeatures = [],
    styleTags = [],
    styleDetails = []
  } = results;

  return (
    <div className="results-content">
      <h2 className="section-title">Uploaded Boat</h2>

      <div className="info-grid">
        <div className="info-label">Detected Type</div>
        <div className="info-value">{detectedType}</div>

        <div className="info-label">Engine Type</div>
        <div className="info-value">{engineType}</div>

        <div className="info-label">Estimated Size</div>
        <div className="info-value">{estimatedSize}</div>
      </div>

      <div className="features-section">
        <div className="info-label">Key Features</div>
        <div className="features-list">
          {keyFeatures.map((feature, index) => (
            <span key={index} className="feature-tag">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="style-section">
        <div className="info-label">Style</div>
        <div className="style-tags">
          {styleTags.map((style, index) => (
            <span key={index} className="style-tag">
              {style}
            </span>
          ))}
        </div>
      </div>

      {styleDetails.length > 0 && (
        <div className="style-details">
          <div className="info-label">Style Details</div>
          <div className="style-details-list">
            {styleDetails.map((detail, index) => (
              <div key={index} className="style-detail-item">
                <div className="style-detail-category">{detail.category}</div>
                <div className="style-detail-content">{detail.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="reset-button" onClick={onReset}>
        Analyze Another Boat
      </button>
    </div>
  );
};

export default BoatAnalysisResults;
