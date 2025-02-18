import React, { useState } from 'react';
import styles from './styles.module.css';
import sampleBoats from '../../data/sampleBoats';

const calculateMatchPercentage = (currentBoat, sampleBoat) => {
  // Normalize strings for comparison
  const normalizeString = (str) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
  
  let matchScore = 0;
  const weights = {
    type: 0.6,
    size: 0.4
  };
  
  // Type match
  const typeMatch = () => {
    const currentType = normalizeString(currentBoat.type);
    const sampleType = normalizeString(sampleBoat.type);
    
    const relatedTypes = {
      'sport fishing boat': ['express cruiser', 'center console', 'sports cruiser'],
      'center console cabin boat': ['center console cabin', 'sports cruiser', 'express cruiser'],
      'center console cabin': ['center console cabin', 'sports cruiser', 'express cruiser'],
      'sports cruiser': ['sports cruiser', 'center console cabin', 'express cruiser'],
      'express cruiser': ['express cruiser', 'sports cruiser', 'center console cabin']
    };
    
    // Direct match
    if (currentType === sampleType) return 1;
    
    // Related type match
    const currentTypeRelated = Object.entries(relatedTypes).find(([key]) => 
      normalizeString(key) === currentType
    );
    
    if (currentTypeRelated && currentTypeRelated[1].includes(sampleType)) return 0.8;
    return 0;
  };
  
  // Size match
  const sizeMatch = () => {
    const currentSize = parseFloat(String(currentBoat.length || currentBoat.size).match(/\d+/)?.[0] || '0');
    const sampleSize = parseFloat(String(sampleBoat.length).match(/\d+/)?.[0] || '0');
    
    const sizeDiff = Math.abs(currentSize - sampleSize);
    if (sizeDiff <= 2) return 1;
    if (sizeDiff <= 5) return 0.8;
    if (sizeDiff <= 10) return 0.5;
    return 0;
  };

  const typeScore = typeMatch();
  const sizeScore = sizeMatch();
  
  matchScore = (weights.type * typeScore) + (weights.size * sizeScore);
  return Math.round(matchScore * 100);
};

const BoatFeatures = ({ features = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleFeatures = features.slice(0, 4);
  const remainingCount = Math.max(0, features.length - 4);

  return (
    <div className={styles.features}>
      {visibleFeatures.map((feature, idx) => (
        <span key={`feature-${idx}`} className={styles.feature}>
          {feature}
        </span>
      ))}
      {remainingCount > 0 && (
        <button 
          className={styles.moreFeatures}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          +{remainingCount} more
        </button>
      )}
      {isExpanded && (
        <div className={styles.expandedFeatures}>
          {features.slice(4).map((feature, idx) => (
            <span key={`expanded-${idx}`} className={styles.feature}>
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const SimilarBoats = ({ currentBoat }) => {
  console.log('Current boat:', currentBoat);

  const similarBoats = sampleBoats
    .map(boat => {
      const matchPercentage = calculateMatchPercentage(currentBoat, boat);
      console.log(`Match for ${boat.name}:`, matchPercentage);
      return {
        ...boat,
        matchPercentage
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 3);

  console.log('Similar boats:', similarBoats);

  // Add image error handling
  const handleImageError = (e, boatName) => {
    console.error(`Failed to load image for ${boatName}:`, e.target.src);
    e.target.style.backgroundColor = '#f3f4f6';
  };

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
                data-match={boat.matchPercentage >= 90 ? "high" : boat.matchPercentage >= 80 ? "medium" : "low"}
              >
                {boat.matchPercentage}% Match
              </div>
              <img 
                src={boat.imageUrl} 
                alt={boat.name} 
                className={styles.boatImage}
                onError={(e) => handleImageError(e, boat.name)}
              />
            </div>
            
            <div className={styles.boatInfo}>
              <h3 className={styles.boatName}>{boat.name}</h3>
              <p className={styles.location}>{boat.location}</p>
              
              <div className={styles.specs}>
                <div className={styles.spec}>
                  <span className={styles.label}>Size</span>
                  <span className={styles.value}>{boat.length} ft</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.label}>Type</span>
                  <span className={styles.value}>{boat.type}</span>
                </div>
              </div>
              
              <div className={styles.specs}>
                <div className={styles.spec}>
                  <span className={styles.label}>Engine</span>
                  <span className={styles.value}>{boat.engine}</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.label}>Hull</span>
                  <span className={styles.value}>{boat.hullMaterial}</span>
                </div>
              </div>

              <BoatFeatures features={boat.features} />

              <div className={styles.price}>
                ${new Intl.NumberFormat('en-US').format(boat.price)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarBoats;
