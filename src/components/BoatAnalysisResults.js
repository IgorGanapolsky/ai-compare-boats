import React from 'react';
import './BoatAnalysisResults.css';
import SimilarBoats from './SimilarBoats';
import { RefreshIcon } from './icons/RefreshIcon';

const BoatAnalysisResults = ({ results, imagePreview, onReset, setSelectedBoat, setShowComparison }) => {
  const {
    detectedType,
    estimatedSize,
    keyFeatures = [],
    style = [],
    styleDetails = '',
    hullMaterial = '',
    engineConfig = {}
  } = results;

  // Format engine string from engineConfig
  const engineString = [
    engineConfig.count,
    engineConfig.brand,
    engineConfig.type,
    engineConfig.power ? `(${engineConfig.power})` : ''
  ].filter(Boolean).join(' ');

  const currentBoat = {
    name: 'Your Reference Boat',
    type: detectedType,
    size: estimatedSize,
    keyFeatures,
    description: styleDetails,
    imageUrl: imagePreview,
    features: keyFeatures,
    style,
    hullMaterial: hullMaterial || 'N/A',
    engine: engineString || 'N/A'
  };

  return (
    <div className="boat-analysis-results">
      <div className="results-content">
        <div className="boat-image">
          <img src={imagePreview} alt="Analyzed boat" />
          <button onClick={onReset} className="new-search-button">
            <RefreshIcon />
            New Search
          </button>
        </div>
        
        <div className="boat-details">
          <h2 className="uploaded-boat-title">Uploaded Boat</h2>
          
          <div className="details-grid">
            <div>
              <span className="label">Detected Type</span>
              <span className="value">{detectedType}</span>
            </div>
            {estimatedSize && (
              <div>
                <span className="label">Estimated Size</span>
                <span className="value">{estimatedSize}</span>
              </div>
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
              <label>Boat Style</label>
              <div className="tags-container">
                {style.map((styleItem, index) => (
                  <span key={index} className="style-tag">{styleItem}</span>
                ))}
              </div>
            </div>
          )}

          {styleDetails && (
            <div className="detail-section">
              <label>Detailed Style Analysis</label>
              <div className="style-analysis">
                <p className="style-text">{styleDetails}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SimilarBoats 
        currentBoat={currentBoat}
        setSelectedBoat={setSelectedBoat}
        setShowComparison={setShowComparison}
      />
    </div>
  );
};

export default BoatAnalysisResults;
