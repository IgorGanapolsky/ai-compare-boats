import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateMatchScore } from '../../utils/boatMatching';
import sampleBoats from '../../data/sampleBoats';
import DetailedComparison from '../DetailedComparison';
import styles from './styles.module.css';
import BoatFeatures from '../BoatFeatures';

/**
 * SimilarBoats component displays the top 3 boats similar to the current boat.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.currentBoat - The currently selected boat
 * @returns {JSX.Element} - Rendered component
 */
const SimilarBoats = ({ currentBoat }) => {
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [sortBy, setSortBy] = useState('match'); // Default sort by match percentage
  const [loading, setLoading] = useState(false);
  
  // Cache for storing calculated match results
  const matchResultsCache = useRef({
    currentBoatId: null,
    results: []
  });

  // Get potential similar boats excluding the current boat
  const filteredBoats = useMemo(() => {
    if (!currentBoat) return [];
    return sampleBoats.filter(boat => boat.id !== currentBoat.id);
  }, [currentBoat]);

  // Get the sorted boats to display based on the current sort criteria
  const displayedBoats = useMemo(() => {
    if (!matchResultsCache.current.results.length) {
      return [];
    }
    
    // Always start with a copy of the cached results sorted by match score
    const topMatches = [...matchResultsCache.current.results]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3); // Only take top 3 matches
    
    // Then sort these top 3 matches based on the selected sort criteria
    if (sortBy === 'price') {
      return [...topMatches].sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'length') {
      return [...topMatches].sort((a, b) => {
        const lengthA = a.length || 0;
        const lengthB = b.length || 0;
        return lengthA - lengthB;
      });
    }
    
    // Default is already sorted by match percentage
    return topMatches;
  }, [sortBy, matchResultsCache.current.results]);

  // Calculate match scores asynchronously when the current boat changes
  useEffect(() => {
    const calculateMatches = async () => {
      if (!currentBoat || filteredBoats.length === 0) {
        matchResultsCache.current = { currentBoatId: null, results: [] };
        return;
      }

      // If we already calculated matches for this boat, use cached results
      if (matchResultsCache.current.currentBoatId === currentBoat.id) {
        return;
      }

      setLoading(true);
      
      try {
        // Process boats to calculate match scores
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
        
        // Update the cache with full results (sorted by match score)
        matchResultsCache.current = {
          currentBoatId: currentBoat.id,
          results: boatsWithScores
        };
      } catch (error) {
        console.error('Error processing similar boats:', error);
        matchResultsCache.current = { currentBoatId: null, results: [] };
      } finally {
        setLoading(false);
      }
    };

    calculateMatches();
  }, [currentBoat, filteredBoats]);

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

  // If no current boat is selected, show a message
  if (!currentBoat) {
    return (
      <div className={styles.similarBoatsContainer}>
        <h2>Similar Boats</h2>
        <p className={styles.noBoatSelected}>Please select a boat to see similar options</p>
      </div>
    );
  }

  return (
    <div className={styles.similarBoatsContainer}>
      <h2>Similar Boats Found</h2>
      
      <div className={styles.sortControls}>
        <label htmlFor="sortBy">Sort by: </label>
        <select 
          id="sortBy" 
          value={sortBy}
          onChange={handleSortChange}
          className={styles.sortSelect}
        >
          <option value="match">Match %</option>
          <option value="price">Price (Low to High)</option>
          <option value="length">Length (Short to Long)</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Calculating matches...</p>
        </div>
      ) : displayedBoats.length === 0 ? (
        <p className={styles.noMatches}>No similar boats found</p>
      ) : (
        <div className={styles.boatGrid}>
          {displayedBoats.map(boat => (
            <div 
              key={boat.id}
              className={`${styles.boatCard} ${selectedBoat === boat ? styles.selectedCard : ''}`}
              onClick={() => handleBoatSelect(boat)}
            >
              <div className={styles.boatImageContainer}>
                <img 
                  src={boat.imageUrl} 
                  alt={boat.name}
                  className={styles.boatImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <div className={styles.matchBadge}>
                  <span className={getMatchScoreClass(boat.matchScore)}>
                    {formatMatchPercentage(boat.matchScore)} Match
                  </span>
                </div>
              </div>
              <div className={styles.boatInfo}>
                <h3>{boat.name}</h3>
                <div className={styles.boatDetails}>
                  {boat.price && <p>Price: ${boat.price.toLocaleString()}</p>}
                  {boat.length && <p>Length: {boat.length} ft</p>}
                  {boat.type && <p>Type: {boat.type}</p>}
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
