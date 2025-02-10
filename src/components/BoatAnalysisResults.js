import React from 'react';
import './BoatAnalysisResults.css';

const BoatAnalysisResults = ({ analysisResults, onNewSearch, isLoading }) => {
  // Show loading state
  if (isLoading) {
    return (
      <div className="results-container">
        <h2 className="section-title">Analyzing Boat</h2>
        <div className="info-grid">
          <div className="info-label">Detected Type</div>
          <div className="info-value">Analyzing...</div>
          
          <div className="info-label">Engine Type</div>
          <div className="info-value">Analyzing...</div>
          
          <div className="info-label">Estimated Size</div>
          <div className="info-value">Analyzing...</div>
        </div>
      </div>
    );
  }

  // Don't show anything if no results
  if (!analysisResults) {
    return null;
  }

  const {
    detectedType = 'Not detected',
    engineType = 'Not detected',
    estimatedSize = 'Not detected',
    keyFeatures = [],
    styleTags = [],
    styleDetails = []
  } = analysisResults;

  return (
    <div className="results-container">
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
        <div className="style-details">
          {styleDetails.map((detail, index) => (
            <div key={index} className="style-category">
              <div className="style-category-header">
                {detail.category}
              </div>
              <div className="style-category-content">
                {detail.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="new-search-button" onClick={onNewSearch}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.3333 2.66667V6.66667H9.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.66667 13.3333V9.33333H6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.34667 6C3.73475 4.90547 4.43673 3.94604 5.36471 3.24839C6.29269 2.55074 7.40245 2.14666 8.55555 2.08534C9.70864 2.02401 10.8526 2.30799 11.8452 2.90443C12.8378 3.50086 13.6345 4.38262 14.1373 5.43333M1.86267 10.5667C2.36553 11.6174 3.16219 12.4991 4.15481 13.0956C5.14743 13.692 6.29136 13.976 7.44445 13.9147C8.59755 13.8533 9.70731 13.4493 10.6353 12.7516C11.5633 12.054 12.2652 11.0945 12.6533 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        New Search
      </button>
    </div>
  );
};

export default BoatAnalysisResults;
