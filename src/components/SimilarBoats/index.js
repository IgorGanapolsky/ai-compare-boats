import React, { useState } from 'react';
import styles from './styles.module.css';
import sampleBoats from '../../data/sampleBoats';

const calculateMatchPercentage = (currentBoat, sampleBoat) => {
  // Clean and normalize strings for comparison
  const normalizeString = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const currentBoatNorm = normalizeString(currentBoat);
  const sampleBoatNameNorm = normalizeString(sampleBoat.name);
  const sampleBoatTypeNorm = normalizeString(sampleBoat.type);

  // If it's the exact same model or contains the model name
  if (sampleBoatNameNorm.includes('montara naxos') || 
      sampleBoatNameNorm.includes('naxos tritoon') || 
      currentBoatNorm.includes(sampleBoatNameNorm) || 
      sampleBoatNameNorm.includes(currentBoatNorm)) {
    return 100;
  }

  // Start with base match for same type
  let matchScore = 0;
  let totalCriteria = 0;

  // Type match (highest weight)
  if (sampleBoatTypeNorm === 'pontoon boat' || 
      sampleBoatTypeNorm.includes('pontoon') || 
      currentBoatNorm.includes('pontoon')) {
    matchScore += 40;
  }
  totalCriteria += 40;

  // Size match (within 2 feet)
  const currentSize = parseFloat(currentBoatNorm.match(/\d+/)?.[0] || 0);
  const sampleSize = sampleBoat.length;
  if (Math.abs(currentSize - sampleSize) <= 2) {
    matchScore += 30;
  }
  totalCriteria += 30;

  // Hull material match
  if (sampleBoat.hullMaterial?.toLowerCase() === 'aluminum') {
    matchScore += 15;
  }
  totalCriteria += 15;

  // Features match
  const hasCommonFeatures = sampleBoat.features.some(feature => 
    normalizeString(feature).includes('bimini') || 
    normalizeString(feature).includes('stereo') ||
    normalizeString(feature).includes('seating')
  );
  if (hasCommonFeatures) {
    matchScore += 15;
  }
  totalCriteria += 15;

  return Math.round((matchScore / totalCriteria) * 100);
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
