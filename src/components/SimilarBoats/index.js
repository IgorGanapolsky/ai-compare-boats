import React, { useState, useMemo, useCallback } from 'react';
import { calculateMatchScore } from '../../utils/boatMatching';
import sampleBoats from '../../data/sampleBoats';
import DetailedComparison from '../DetailedComparison';
import styles from './styles.module.css';
import BoatFeatures from '../BoatFeatures';

/**
 * SimilarBoats component displays a list of boats similar to the current boat.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.currentBoat - The currently selected boat
 * @returns {JSX.Element} - Rendered component
 */
const SimilarBoats = ({ currentBoat }) => {
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [sortBy, setSortBy] = useState('match'); // Default sort by match percentage

  // Calculate similar boats using memoization for performance
  const similarBoats = useMemo(() => {
    if (!currentBoat) {
      return [];
    }

    // Get all boats except the current one
    return sampleBoats
      .filter(boat => boat.id !== currentBoat.id) // Filter out the current boat
      .map(boat => {
        try {
          // Use pre-defined matchScore if available, otherwise calculate it
          const matchScore = boat.matchScore !== undefined ? 
                             boat.matchScore : 
                             calculateMatchScore(currentBoat, boat);
          return {
            ...boat,
            matchScore
          };
        } catch (error) {
          console.error(`Error calculating match score for ${boat.name}:`, error);
          return {
            ...boat,
            matchScore: 0
          };
        }
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore; // Sort by match score (highest first)
        } else if (sortBy === 'price') {
          // Handle potential missing prices
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB; // Sort by price (lowest first)
        } else if (sortBy === 'length') {
          // Handle potential missing lengths
          const lengthA = a.length || 0;
          const lengthB = b.length || 0;
          return lengthA - lengthB; // Sort by length (shortest first)
        }
        return 0;
      })
      .slice(0, 3); // Get top 3 matches
  }, [currentBoat, sortBy]);

  // Format boat length with proper units
  const formatBoatLength = (boat) => {
    if (!boat.length) return 'N/A';
    return `${boat.length} ft`;
  };

  // Handle boat selection for detailed comparison
  const handleImageClick = useCallback((boat, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setSelectedBoat(boat);
  }, []);

  // If there's no current boat, display a placeholder
  if (!currentBoat) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <h3>Select a boat to see similar options</h3>
          <p>Upload an image or select from our catalog to see matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Similar Boats Found</h2>
        <div className={styles.sortOptions}>
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelector}
          >
            <option value="match">Match %</option>
            <option value="price">Price</option>
            <option value="length">Length</option>
          </select>
        </div>
      </div>

      <div className={styles.boatsGrid}>
        {similarBoats.length > 0 ? (
          similarBoats.map((boat, index) => (
            <div
              key={index}
              className={styles.boatCard}
            >
              <div className={styles.imageContainer}>
                <div
                  className={styles.matchBadge}
                  data-match={boat.matchScore === 100 ? "perfect" : boat.matchScore >= 90 ? "high" : boat.matchScore >= 75 ? "medium" : "low"}
                >
                  {isNaN(boat.matchScore) ? 'N/A' : `${Math.round(boat.matchScore)}% Match`}
                </div>
                <img
                  src={boat.imageUrl}
                  alt={boat.name}
                  className={styles.boatImage}
                  onClick={(e) => handleImageClick(boat, e)}
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    console.error(`Failed to load image for ${boat.name}:`, e.target.src);
                    e.target.src = '/placeholder-boat.jpg'; // Fallback image
                  }}
                />
              </div>

              <div className={styles.boatInfo}>
                <h3 className={styles.boatName}>{boat.name}</h3>
                <p className={styles.location}>{boat.location || 'Location not specified'}</p>

                <div className={styles.specs}>
                  <div className={styles.spec}>
                    <span className={styles.label}>Size</span>
                    <span className={styles.value}>{formatBoatLength(boat)}</span>
                  </div>
                  <div className={styles.spec}>
                    <span className={styles.label}>Type</span>
                    <span className={styles.value}>{boat.type || 'N/A'}</span>
                  </div>
                </div>

                <div className={styles.specs}>
                  <div className={styles.spec}>
                    <span className={styles.label}>Engine</span>
                    <span className={styles.value}>{boat.engine || 'N/A'}</span>
                  </div>
                  <div className={styles.spec}>
                    <span className={styles.label}>Hull</span>
                    <span className={styles.value}>{boat.hullMaterial || 'N/A'}</span>
                  </div>
                </div>

                <BoatFeatures features={boat.features} />

                <div className={styles.price}>
                  {boat.price
                    ? `$${new Intl.NumberFormat('en-US').format(boat.price)}`
                    : 'Price not specified'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <p>No similar boats found. Try adjusting your criteria.</p>
          </div>
        )}
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
