import React from 'react';
import './BoatAnalysisResults.css';
import SimilarBoats from './SimilarBoats';

const BoatAnalysisResults = ({ results, imagePreview, onReset }) => {
  const {
    detectedType,
    estimatedSize,
    keyFeatures = [],
    style = [],
    styleDetails = ''
  } = results;

  return (
    <div className="boat-analysis-results">
      <div className="results-content">
        <div className="boat-image">
          <img src={imagePreview} alt="Analyzed boat" />
          <button onClick={onReset} className="new-search-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 8C13.3333 10.9467 10.9467 13.3333 8 13.3333C5.05333 13.3333 2.66667 10.9467 2.66667 8C2.66667 5.05333 5.05333 2.66667 8 2.66667M8 2.66667L10.6667 5.33333M8 2.66667L5.33333 5.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Search
          </button>
        </div>

        <div className="boat-details">
          <div className="details-grid">
            <span className="label">Detected Type</span>
            <span className="value">{detectedType}</span>
            {estimatedSize && (
              <React.Fragment>
                <span className="label">Estimated Size</span>
                <span className="value">{estimatedSize}</span>
              </React.Fragment>
            )}
          </div>

          {keyFeatures && keyFeatures.length > 0 && (
            <div className="detail-section">
              <label>Key Features</label>
              <div className="tags-container">
                {keyFeatures.map((feature, index) => (
                  <span key={index} className="style-tag">{feature}</span>
                ))}
              </div>
            </div>
          )}

          {style && style.length > 0 && (
            <div className="detail-section">
              <label>Style</label>
              <div className="tags-container">
                {style.map((styleItem, index) => (
                  <span key={index} className="style-tag">{styleItem}</span>
                ))}
              </div>
            </div>
          )}

          {styleDetails && (
            <div className="detail-section">
              <label>Style Analysis</label>
              <div className="style-analysis">
                <p className="style-text">{styleDetails}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SimilarBoats currentBoatType={detectedType} />
    </div>
  );
};

export default BoatAnalysisResults;
