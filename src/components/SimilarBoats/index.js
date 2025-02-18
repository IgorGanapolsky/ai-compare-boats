import React, { useState } from 'react';
import styles from './styles.module.css';
import sampleBoats from '../../data/sampleBoats';
import DetailedComparison from '../DetailedComparison';
import { calculateMatchScore } from '../../utils/boatMatching';

export const getFeatureAnalysis = (currentBoat, comparisonBoat) => {
  // Extract features from boat descriptions and feature lists
  const extractFeatures = (boat) => {
    const features = new Set();
    
    // Add explicit features if they exist
    if (Array.isArray(boat.features)) {
      boat.features.forEach(f => features.add(f.trim()));
    }
    
    // Extract features from description
    const description = boat.description || '';
    const addFeatureIfPresent = (feature) => {
      if (description.toLowerCase().includes(feature.toLowerCase())) {
        features.add(feature);
      }
    };

    // Common boat features to look for
    const commonFeatures = [
      'Enclosed cabin',
      'Hardtop',
      'Rod holders',
      'Navigation equipment',
      'Deck space',
      'Galley',
      'Cabin',
      'Fishing amenities',
      'Air conditioning',
      'Generator',
      'Storage',
      'Windshield',
      'Seating'
    ];

    commonFeatures.forEach(addFeatureIfPresent);
    
    return features;
  };

  const currentFeatures = extractFeatures(currentBoat);
  const comparisonFeatures = extractFeatures(comparisonBoat);
  
  // Find common features
  const commonFeatures = [...currentFeatures].filter(x => 
    [...comparisonFeatures].some(y => y.toLowerCase() === x.toLowerCase())
  );
  
  // Find unique features for each boat
  const uniqueToCurrentBoat = [...currentFeatures].filter(x => 
    ![...comparisonFeatures].some(y => y.toLowerCase() === x.toLowerCase())
  );
  const uniqueToComparisonBoat = [...comparisonFeatures].filter(x => 
    ![...currentFeatures].some(y => y.toLowerCase() === x.toLowerCase())
  );
  
  const totalUniqueFeatures = uniqueToCurrentBoat.length + uniqueToComparisonBoat.length;
  const featureMatchRate = commonFeatures.length > 0 ? 
    Math.round((commonFeatures.length / (commonFeatures.length + totalUniqueFeatures)) * 100) : 0;
  
  return {
    featureMatchRate,
    commonFeatures,
    uniqueToCurrentBoat,
    uniqueToComparisonBoat,
    commonFeaturesCount: commonFeatures.length,
    uniqueFeaturesCount: totalUniqueFeatures
  };
};

const getBoatLength = (boat) => {
  if (boat.length) return boat.length;
  if (boat.dimensions?.lengthOverall) {
    const match = boat.dimensions.lengthOverall.match(/(\d+)/);
    return match ? parseFloat(match[1]) : null;
  }
  if (typeof boat.size === 'string') {
    const match = boat.size.match(/(\d+)/);
    return match ? parseFloat(match[1]) : null;
  }
  return boat.size || null;
};

const formatBoatLength = (boat) => {
  const length = getBoatLength(boat);
  return length ? `${Math.round(length)} ft` : 'N/A';
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
  const [selectedBoat, setSelectedBoat] = useState(null);
  
  console.log('Current boat:', currentBoat);

  const similarBoats = sampleBoats
    .map(boat => {
      const matchScore = calculateMatchScore(currentBoat, boat);
      console.log(`Match for ${boat.name}:`, matchScore);
      return {
        ...boat,
        matchScore
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  console.log('Similar boats:', similarBoats);

  const handleImageClick = (boat, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setSelectedBoat(boat);
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
        {similarBoats.map((boat, index) => (
          <div 
            key={index} 
            className={styles.boatCard}
          >
            <div className={styles.imageContainer}>
              <div 
                className={styles.matchBadge}
                data-match={boat.matchScore >= 90 ? "high" : boat.matchScore >= 80 ? "medium" : "low"}
              >
                {isNaN(boat.matchScore) ? 'N/A' : `${boat.matchScore}% Match`}
              </div>
              <img 
                src={boat.imageUrl} 
                alt={boat.name} 
                className={styles.boatImage}
                onClick={(e) => handleImageClick(boat, e)}
                style={{ cursor: 'pointer' }}
                onError={(e) => console.error(`Failed to load image for ${boat.name}:`, e.target.src)}
              />
            </div>
            
            <div className={styles.boatInfo}>
              <h3 className={styles.boatName}>{boat.name}</h3>
              <p className={styles.location}>{boat.location}</p>
              
              <div className={styles.specs}>
                <div className={styles.spec}>
                  <span className={styles.label}>Size</span>
                  <span className={styles.value}>{formatBoatLength(boat)}</span>
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

      {selectedBoat && (
        <DetailedComparison
          currentBoat={currentBoat}
          comparisonBoat={selectedBoat}
          onClose={() => setSelectedBoat(null)}
        />
      )}
    </div>
  );
};

export default SimilarBoats;
