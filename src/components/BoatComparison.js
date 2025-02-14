import React, { useState } from 'react';
import { useBoatComparison } from '../hooks/useBoatComparison';

function BoatCard({ boat, isSelected, onSelect }) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  const displayedFeatures = showAllFeatures ? boat.features : boat.features?.slice(0, 4);
  
  return (
    <div
      className={`boat-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(boat)}
    >
      {boat.name && <h3>{boat.name}</h3>}
      <div className="boat-details">
        <div className="boat-specs-grid">
          {boat.length && (
            <div className="spec-item">
              <i className="fas fa-ruler"></i>
              <span>Length: {boat.length}ft</span>
            </div>
          )}
          {boat.year && (
            <div className="spec-item">
              <i className="fas fa-calendar"></i>
              <span>Year: {boat.year}</span>
            </div>
          )}
          {boat.engine && (
            <div className="spec-item">
              <i className="fas fa-engine"></i>
              <span>Engine: {boat.engine}</span>
            </div>
          )}
          {boat.totalPower && (
            <div className="spec-item">
              <i className="fas fa-tachometer"></i>
              <span>Power: {boat.totalPower}</span>
            </div>
          )}
          {typeof boat.engineHours === 'number' && (
            <div className="spec-item">
              <i className="fas fa-clock"></i>
              <span>Hours: {boat.engineHours}</span>
            </div>
          )}
          {boat.type && (
            <div className="spec-item">
              <i className="fas fa-ship"></i>
              <span>Type: {boat.type}</span>
            </div>
          )}
        </div>
        
        {(boat.location || boat.dealership) && (
          <div className="boat-location">
            <i className="fas fa-map-marker-alt"></i>
            {boat.location && <span>{boat.location}</span>}
            {boat.dealership && <div className="dealer">{boat.dealership}</div>}
          </div>
        )}

        {typeof boat.price === 'number' && (
          <div className="boat-price">
            <strong>${boat.price.toLocaleString()}</strong>
          </div>
        )}
      </div>

      {boat.dimensions && (
        <div className="boat-dimensions">
          <h4>Dimensions</h4>
          <div className="dimensions-grid">
            {boat.dimensions.beam && <div>Beam: {boat.dimensions.beam}</div>}
            {(boat.dimensions.maxDraft || boat.dimensions.draft) && (
              <div>Draft: {boat.dimensions.maxDraft || boat.dimensions.draft}</div>
            )}
            {boat.dimensions.lengthOverall && <div>LOA: {boat.dimensions.lengthOverall}</div>}
          </div>
        </div>
      )}

      {boat.tanks && (
        <div className="boat-tanks">
          <h4>Capacities</h4>
          <div className="tanks-grid">
            {boat.tanks.fuel && <div>Fuel: {boat.tanks.fuel}</div>}
            {boat.tanks.freshWater && <div>Water: {boat.tanks.freshWater}</div>}
            {boat.tanks.holding && <div>Holding: {boat.tanks.holding}</div>}
          </div>
        </div>
      )}

      {boat.features && boat.features.length > 0 && (
        <div className="boat-features">
          <h4>Features</h4>
          <ul>
            {displayedFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          {boat.features.length > 4 && (
            <button 
              className="show-more-btn"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card selection when clicking button
                setShowAllFeatures(!showAllFeatures);
              }}
            >
              {showAllFeatures ? 'Show Less' : `+${boat.features.length - 4} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { boatComparisonService } from '../services/boatComparisonService';

export function BoatComparison({ boat1, boat2 }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compareBoats = async () => {
      setLoading(true);
      try {
        const result = await boatComparisonService.compareBoats(boat1, boat2);
        setComparison(result);
      } catch (error) {
        console.error('Error comparing boats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (boat1 && boat2) {
      compareBoats();
    }
  }, [boat1, boat2]);

  if (loading) {
    return <div className="comparison-loading">Analyzing boats...</div>;
  }

  if (!comparison) {
    return null;
  }

  const { overallScore, details } = comparison;

  return (
    <div className="comparison-results">
      <div className="comparison-header">
        <h3>Boat Comparison</h3>
        <div 
          className="similarity-score"
          style={getSoftGradientStyle(overallScore)}
        >
          {overallScore}% Similarity
        </div>
      </div>

      <div className="comparison-details">
        {/* Length Comparison */}
        <div className="comparison-section">
          <h4>Length</h4>
          <div className="detail-row">
            <span className="label">Difference:</span>
            <span>{details.length.difference} {details.length.unit}</span>
          </div>
          <div 
            className="similarity-score small"
            style={getSoftGradientStyle(details.length.score)}
          >
            {details.length.score}% Match
          </div>
        </div>

        {/* Type Comparison */}
        <div className="comparison-section">
          <h4>Boat Type</h4>
          <div className="detail-row">
            <span>{details.type.types[0]}</span>
            <span>vs</span>
            <span>{details.type.types[1]}</span>
          </div>
          <div 
            className="similarity-score small"
            style={getSoftGradientStyle(details.type.score)}
          >
            {details.type.score}% Match
          </div>
        </div>

        {/* Features Comparison */}
        <div className="comparison-section">
          <h4>Features</h4>
          <div className="features-grid">
            <div className="feature-column">
              <h5>Common Features</h5>
              {details.features.common.map((feature, index) => (
                <div key={index} className="feature-tag common">
                  {feature}
                </div>
              ))}
            </div>
            <div className="feature-column">
              <h5>Unique to {boat1.name}</h5>
              {details.features.unique1.map((feature, index) => (
                <div key={index} className="feature-tag unique">
                  {feature}
                </div>
              ))}
            </div>
            <div className="feature-column">
              <h5>Unique to {boat2.name}</h5>
              {details.features.unique2.map((feature, index) => (
                <div key={index} className="feature-tag unique">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div 
            className="similarity-score small"
            style={getSoftGradientStyle(details.features.score)}
          >
            {details.features.score}% Feature Match
          </div>
        </div>

        {/* Specifications Comparison */}
        <div className="comparison-section">
          <h4>Specifications</h4>
          {details.specifications.engine && (
            <div className="spec-row">
              <span className="label">Engine:</span>
              <div className="spec-values">
                <span>{details.specifications.engine.values[0]}</span>
                <span>vs</span>
                <span>{details.specifications.engine.values[1]}</span>
              </div>
            </div>
          )}
          {details.specifications.hullMaterial && (
            <div className="spec-row">
              <span className="label">Hull Material:</span>
              <div className="spec-values">
                <span>{details.specifications.hullMaterial.values[0]}</span>
                <span>vs</span>
                <span>{details.specifications.hullMaterial.values[1]}</span>
              </div>
            </div>
          )}
          {details.specifications.engineHours && (
            <div className="spec-row">
              <span className="label">Engine Hours:</span>
              <div className="spec-values">
                <span>{details.specifications.engineHours.values[0]}</span>
                <span>vs</span>
                <span>{details.specifications.engineHours.values[1]}</span>
              </div>
              <div className="difference">
                Difference: {details.specifications.engineHours.difference} hours
              </div>
            </div>
          )}
          {details.specifications.price && (
            <div className="spec-row">
              <span className="label">Price:</span>
              <div className="spec-values">
                <span>${details.specifications.price.values[0].toLocaleString()}</span>
                <span>vs</span>
                <span>${details.specifications.price.values[1].toLocaleString()}</span>
              </div>
              <div className="difference">
                Difference: ${details.specifications.price.difference.toLocaleString()} 
                ({details.specifications.price.percentDifference}%)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getSoftGradientStyle(score) {
  const gradientWidth = Math.max(20, Math.min(100, score));
  return {
    background: `linear-gradient(to right, 
      #a8e6cf 0%,
      #bde0fe ${gradientWidth * 0.25}%,
      #ddd6f3 ${gradientWidth * 0.5}%,
      #ffd3b6 ${gradientWidth * 0.75}%,
      #ffaaa5 ${gradientWidth}%,
      #f8f9fa ${gradientWidth}%,
      #f8f9fa 100%)`,
    color: '#444',
    backgroundSize: '100% 100%',
    backgroundClip: 'padding-box'
  };
}
