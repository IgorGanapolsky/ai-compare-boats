import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  const [matchedBoats, setMatchedBoats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get potential similar boats excluding the current boat
  const filteredBoats = useMemo(() => {
    if (!currentBoat) return [];
    return sampleBoats.filter(boat => boat.id !== currentBoat.id);
  }, [currentBoat]);

  // Calculate match scores asynchronously when the current boat changes
  useEffect(() => {
    const calculateMatches = async () => {
      if (!currentBoat || filteredBoats.length === 0) {
        setMatchedBoats([]);
        return;
      }

      setLoading(true);
      
      try {
        // Process boats in batches to avoid UI freezing
        const boatsWithScores = [];
        
        for (const boat of filteredBoats) {
          try {
            // Use pre-defined matchScore if available, otherwise calculate it
            let matchScore;
            if (boat.matchScore !== undefined) {
              matchScore = boat.matchScore;
            } else {
              matchScore = await calculateMatchScore(currentBoat, boat);
            }
            
            boatsWithScores.push({
              ...boat,
              matchScore
            });
          } catch (error) {
            console.error(`Error calculating match score for ${boat.name}:`, error);
            boatsWithScores.push({
              ...boat,
              matchScore: 0
            });
          }
        }
        
        // Sort the boats based on current sort criteria
        const sortedBoats = sortBoats(boatsWithScores, sortBy);
        setMatchedBoats(sortedBoats);
      } catch (error) {
        console.error('Error processing similar boats:', error);
        setMatchedBoats([]);
      } finally {
        setLoading(false);
      }
    };

    calculateMatches();
  }, [currentBoat, filteredBoats, sortBy]);

  // Function to sort boats based on criteria
  const sortBoats = (boats, sortCriteria) => {
    return [...boats].sort((a, b) => {
      if (sortCriteria === 'match') {
        return b.matchScore - a.matchScore; // Sort by match score (highest first)
      } else if (sortCriteria === 'price') {
        // Handle potential missing prices
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceA - priceB; // Sort by price (lowest first)
      } else if (sortCriteria === 'length') {
        // Handle potential missing lengths
        const lengthA = a.length || 0;
        const lengthB = b.length || 0;
        return lengthA - lengthB; // Sort by length (shortest first)
      }
      return 0;
    });
  };

  // Handle sort change
  const handleSortChange = useCallback((e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
  }, []);

  // Handle boat selection for detailed comparison
  const handleBoatSelect = useCallback((boat) => {
    setSelectedBoat(boat === selectedBoat ? null : boat);
  }, [selectedBoat]);

  // Format match percentage for display
  const formatMatchPercentage = useCallback((score) => {
    return `${Math.round(score)}%`;
  }, []);

  // Get CSS class based on match percentage
  const getMatchScoreClass = useCallback((score) => {
    if (score >= 80) return styles.highMatch;
    if (score >= 60) return styles.mediumMatch;
    return styles.lowMatch;
  }, []);

  // Format boat length with proper units
  const formatBoatLength = useCallback((boat) => {
    if (!boat.length) return 'N/A';
    return `${boat.length} ft`;
  }, []);

  // If no current boat is selected, show a message
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
            onChange={handleSortChange}
            className={styles.sortSelector}
          >
            <option value="match">Match %</option>
            <option value="price">Price</option>
            <option value="length">Length</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Calculating matches...</p>
        </div>
      ) : matchedBoats.length === 0 ? (
        <div className={styles.noResults}>
          <p>No similar boats found. Try adjusting your criteria.</p>
        </div>
      ) : (
        <div className={styles.boatsGrid}>
          {matchedBoats.map((boat, index) => (
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
                  onClick={(e) => handleBoatSelect(boat, e)}
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
          ))}
        </div>
      )}

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
