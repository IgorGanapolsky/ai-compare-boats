import React from 'react';
import './BoatAnalysisResults.css';

const BoatAnalysisResults = ({ results, imagePreview, onReset }) => {
  const {
    detectedType,
    estimatedSize,
    keyFeatures = [],
    style = []
  } = results;

  return (
    <div className="boat-analysis-results">
      <div className="results-content">
        <div className="boat-image">
          <img src={imagePreview} alt="Analyzed boat" />
          <button className="new-search-button" onClick={onReset}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 10.0001C16.6667 13.6834 13.6834 16.6667 10 16.6667C6.31669 16.6667 3.33335 13.6834 3.33335 10.0001C3.33335 6.31674 6.31669 3.33341 10 3.33341M10 3.33341L13.3334 6.66674M10 3.33341L6.66669 6.66674" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Search
          </button>
        </div>
        
        <div className="boat-details">
          <div className="details-header">
            <h2>Uploaded Boat</h2>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <label>Detected Type</label>
              <span>{detectedType}</span>
            </div>
            {estimatedSize && (
              <div className="detail-item">
                <label>Estimated Size</label>
                <span>{estimatedSize}</span>
              </div>
            )}
          </div>

          {keyFeatures && keyFeatures.length > 0 && (
            <div className="detail-section">
              <div className="section-header">
                <label>Key Features</label>
                <div className="section-badge oval-badge">Key Features</div>
              </div>
              <div className="tags-container">
                {keyFeatures.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>
          )}

          {style && style.length > 0 && (
            <div className="detail-section">
              <div className="section-header">
                <label>Style</label>
                <div className="section-badge oval-badge">Style</div>
              </div>
              <div className="tags-container">
                {style.map((styleItem, index) => (
                  <span key={index} className="feature-tag">{styleItem}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoatAnalysisResults;
