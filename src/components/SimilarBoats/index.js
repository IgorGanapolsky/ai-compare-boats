import React, { useState } from 'react';
import styles from './styles.module.css';
import sampleBoats from '../../data/sampleBoats';

const calculateMatchPercentage = (currentBoat, sampleBoat) => {
  // Normalize strings for comparison
  const normalizeString = (str) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
  
  // First check if it's the exact same model
  if (normalizeString(currentBoat).includes('axopar') && 
      normalizeString(sampleBoat.name).includes('axopar 37xc cross cabin')) {
    return 100;
  }
  
  let matchScore = 0;
  const weights = {
    type: 40,      // Boat type is most important
    length: 25,    // Length is second most important
    features: 20,  // Features third most important
    year: 15       // Year least important but still relevant
  };
  
  // 1. Type Match (40%)
  const typeMatch = () => {
    const types = {
      'center console': ['center console', 'cc', 'center console cabin', 'sports cruiser', 'cabin cruiser'],
      'express cruiser': ['express cruiser', 'sport cruiser', 'cruiser', 'cabin cruiser'],
      'sports cruiser': ['sport cruiser', 'express cruiser', 'cruiser', 'center console cabin'],
      'pontoon': ['pontoon', 'tritoon'],
      'motor yacht': ['motor yacht', 'yacht'],
      'bowrider': ['bowrider', 'deck boat'],
      'cabin cruiser': ['cabin cruiser', 'express cruiser', 'cruiser', 'center console cabin']
    };
    
    const normalizedType = normalizeString(currentBoat);
    const sampleType = normalizeString(sampleBoat.type);
    
    // Direct match
    if (normalizedType === sampleType) return 1;
    
    // Check related types
    for (const [, relatedTypes] of Object.entries(types)) {
      if (relatedTypes.includes(normalizedType) && relatedTypes.includes(sampleType)) {
        return 0.9;
      }
    }
    
    return 0;
  };
  
  // 2. Length Match (25%)
  const lengthMatch = () => {
    const currentLength = parseFloat(String(sampleBoat.length));
    if (isNaN(currentLength)) return 0;
    
    const lengthDiff = Math.abs(currentLength - parseFloat(String(sampleBoat.length)));
    if (lengthDiff <= 2) return 1;        // Within 2 feet
    if (lengthDiff <= 5) return 0.8;      // Within 5 feet
    if (lengthDiff <= 10) return 0.5;     // Within 10 feet
    return 0;
  };
  
  // 3. Features Match (20%)
  const featuresMatch = () => {
    if (!Array.isArray(sampleBoat.features)) return 0;
    
    const commonFeatures = [
      'cabin',
      'console',
      'fishing',
      'cruising',
      'navigation',
      'seating',
      'storage',
      'platform',
      'electronics'
    ];
    
    let matchCount = 0;
    const normalizedFeatures = sampleBoat.features.map(f => normalizeString(f));
    
    commonFeatures.forEach(feature => {
      if (normalizedFeatures.some(f => f.includes(feature))) {
        matchCount++;
      }
    });
    
    return matchCount / commonFeatures.length;
  };
  
  // 4. Year Match (15%)
  const yearMatch = () => {
    const currentYear = new Date().getFullYear();
    const boatYear = parseInt(sampleBoat.year);
    if (isNaN(boatYear)) return 0;
    
    const yearDiff = Math.abs(currentYear - boatYear);
    if (yearDiff === 0) return 1;        // Same year
    if (yearDiff <= 2) return 0.8;       // Within 2 years
    if (yearDiff <= 5) return 0.6;       // Within 5 years
    return 0.4;                          // Older
  };
  
  // Calculate weighted scores
  matchScore += weights.type * typeMatch();
  matchScore += weights.length * lengthMatch();
  matchScore += weights.features * featuresMatch();
  matchScore += weights.year * yearMatch();
  
  return Math.round(matchScore);
};

const getMatchLevel = (percentage) => {
  if (percentage >= 90) return "high";
  if (percentage >= 80) return "medium";
  return "low";
};

const BoatFeatures = ({ features }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={styles.features}>
      {/* Always show first 4 features */}
      {features.slice(0, 4).map((feature, idx) => (
        <span key={`initial-${idx}`} className={styles.feature}>{feature}</span>
      ))}
      
      {features.length > 4 && (
        <>
          <button 
            className={styles.moreFeatures}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : `+${features.length - 4} more`}
          </button>
          <div className={`${styles.expandedFeatures} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.expandedContent}>
              {/* Only show remaining features after the first 4 when expanded */}
              {features.slice(4).map((feature, idx) => (
                <span key={`expanded-${idx}`} className={styles.feature}>{feature}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SimilarBoats = ({ currentBoatType }) => {
  const similarBoats = sampleBoats
    .map(boat => ({
      ...boat,
      matchPercentage: calculateMatchPercentage(currentBoatType, boat)
    }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 3);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Similar Boats Found</h2>
        <div className={styles.sortBy}>
          <span>Sort by:</span>
          <select className={styles.sortSelect}>
            <option value="match">Match %</option>
          </select>
        </div>
      </div>

      <div className={styles.boatsGrid}>
        {similarBoats.map((boat) => (
          <div key={boat.id} className={styles.boatCard}>
            <div className={styles.imageContainer}>
              <div 
                className={styles.matchBadge}
                data-match={getMatchLevel(boat.matchPercentage)}
              >
                {boat.matchPercentage}% Match
              </div>
              <img src={boat.imageUrl} alt={boat.name} className={styles.boatImage} />
            </div>
            
            <div className={styles.boatInfo}>
              <div className={styles.nameLocation}>
                <h3 className={styles.boatName}>{boat.name}</h3>
                <p className={styles.location}>{boat.location}</p>
              </div>

              <div className={styles.specs}>
                <div className={styles.spec}>
                  <span className={styles.label}>Size:</span>
                  <span className={styles.value}>{boat.length} ft</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{boat.type}</span>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.engineInfo}>
                  <span className={styles.label}>Engine:</span>
                  <span className={styles.value}>{boat.engine}</span>
                </div>
                <div className={styles.hullInfo}>
                  <span className={styles.label}>Hull:</span>
                  <span className={styles.value}>{boat.hullMaterial}</span>
                </div>
              </div>

              <BoatFeatures features={boat.features} />

              <div className={styles.price}>
                ${boat.price ? new Intl.NumberFormat('en-US').format(boat.price) : '0'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarBoats;
