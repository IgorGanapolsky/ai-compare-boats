import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import PropTypes from 'prop-types';
import {useAllBoats} from '../../hooks/useAllBoats';
import styles from './styles.module.css';
import {calculateMatchScore} from '../../utils/boatMatching';
import DetailedComparison from '../DetailedComparison';
import ErrorHandler from '../ErrorHandler';

/**
 * SimilarBoats component displays the top 3 boats similar to the current boat.
 *
 * @param {Object} props - Component props
 * @param {Object} props.currentBoat - The currently selected boat
 * @returns {JSX.Element} - Rendered component
 */
const SimilarBoats = ({currentBoat}) => {
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [sortBy, setSortBy] = useState('match'); // Default sort by match percentage
    const [loading, setLoading] = useState(false);
    const [resultsVersion, setResultsVersion] = useState(0); // Add a version to force re-renders
    const [imgErrors, setImgErrors] = useState({});
    const [apiErrors, setApiErrors] = useState([]);
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    // Cache for storing calculated match results
    const matchResultsCache = useRef({
        currentBoatId: null, results: []
    });

    // Create a derived state that changes when the cache or version changes
    // This gives us a proper dependency for useMemo
    const [filteredResults, setFilteredResults] = useState([]);

    // Call useAllBoats at the top level
    const {allBoats} = useAllBoats();

    // Update derived state when cache or version changes
    useEffect(() => {
        setFilteredResults(matchResultsCache.current.results);
    }, [resultsVersion]);

    // Get potential similar boats excluding the current boat
    const filteredBoats = useMemo(() => {
        if (!currentBoat || !allBoats) return [];
        return allBoats.filter(boat => boat.id !== currentBoat.id);
    }, [currentBoat, allBoats]);

    // Get the sorted boats to display based on the current sort criteria
    const displayedBoats = useMemo(() => {
        if (!filteredResults.length) {
            return [];
        }

        // First sort by the selected criteria
        let sortedBoats;

        if (sortBy === 'price') {
            sortedBoats = [...filteredResults].sort((a, b) => {
                // Parse numeric prices, handle missing or non-numeric values
                const getPriceValue = (boat) => {
                    if (typeof boat.price === 'number') return boat.price;
                    if (typeof boat.price === 'string') {
                        // Try to extract numeric value from string (remove $ and commas)
                        const numericPrice = parseFloat(boat.price.replace(/[$,]/g, ''));
                        return isNaN(numericPrice) ? Number.MAX_SAFE_INTEGER : numericPrice;
                    }
                    return Number.MAX_SAFE_INTEGER;
                };

                const priceA = getPriceValue(a);
                const priceB = getPriceValue(b);

                return priceA - priceB; // Sort by price (low to high)
            });
        } else if (sortBy === 'length') {
            sortedBoats = [...filteredResults].sort((a, b) => {
                // Parse numeric lengths, handle missing or non-numeric values
                const getLengthValue = (boat) => {
                    if (typeof boat.length === 'number') return boat.length;
                    if (typeof boat.length === 'string') {
                        // Try to extract numeric value from string
                        const numericLength = parseFloat(boat.length);
                        return isNaN(numericLength) ? Number.MAX_SAFE_INTEGER : numericLength;
                    }
                    return Number.MAX_SAFE_INTEGER;
                };

                const lengthA = getLengthValue(a);
                const lengthB = getLengthValue(b);

                return lengthA - lengthB; // Sort by length (short to long)
            });
        } else {
            // Match percentage sorting (default)
            sortedBoats = [...filteredResults].sort((a, b) => b.matchScore - a.matchScore);
        }

        // Take top 3 boats based on selected criteria
        const top3 = sortedBoats.slice(0, 3);

        // Always ensure the display order is by match percentage
        return [...top3].sort((a, b) => b.matchScore - a.matchScore);
    }, [sortBy, filteredResults]); // Only depend on sortBy and the derived state

    // Calculate match scores asynchronously when the current boat changes
    useEffect(() => {
        const calculateMatches = async () => {
            if (!currentBoat || filteredBoats.length === 0) {
                matchResultsCache.current = {currentBoatId: null, results: []};
                setResultsVersion(v => v + 1); // Increment version to trigger re-render
                return;
            }

            // If we already calculated matches for this boat, use cached results
            if (matchResultsCache.current.currentBoatId === currentBoat.id) {
                return;
            }

            setLoading(true);
            setApiErrors([]); // Clear previous errors

            try {
                const boatsWithScores = [];
                const newErrors = [];

                // Calculate match scores for each boat
                for (const boat of filteredBoats) {
                    try {
                        // Calculate match score asynchronously
                        const matchScore = await calculateMatchScore(currentBoat, boat);

                        boatsWithScores.push({
                            ...boat, matchScore
                        });
                    } catch (error) {
                        // Record the error but continue processing other boats
                        console.error(`Error calculating match score for boat ${boat.id}:`, error);
                        newErrors.push({
                            boatId: boat.id,
                            boatName: boat.name,
                            message: error.message || 'Unknown error during matching',
                            type: error.type || 'general_error'
                        });

                        // Still add the boat with a fallback score
                        boatsWithScores.push({
                            ...boat, matchScore: 50 // Use 50% as a middle-ground fallback
                        });
                    }
                }

                // Update error state if any occurred
                if (newErrors.length > 0) {
                    setApiErrors(newErrors);
                }

                // Update the cache with full results (sorted by match score)
                matchResultsCache.current = {
                    currentBoatId: currentBoat.id, results: boatsWithScores
                };
                setResultsVersion(v => v + 1); // Increment version to trigger re-render
            } catch (error) {
                console.error('Error processing similar boats:', error);
                setApiErrors([{
                    boatId: 'global',
                    message: 'Failed to process matches: ' + (error.message || 'Unknown error'),
                    type: error.type || 'general_error'
                }]);
                matchResultsCache.current = {currentBoatId: null, results: []};
                setResultsVersion(v => v + 1); // Increment version to trigger re-render
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
        // Force a re-render to ensure the sorting is applied immediately
        setResultsVersion(v => v + 1);
    }, []);

    // Handle boat selection for detailed comparison
    const handleBoatSelect = useCallback((boat) => {
        setSelectedBoat(boat === selectedBoat ? null : boat);
    }, [selectedBoat]);

    // Format match percentage for display
    const formatMatchPercentage = useCallback((score) => {
        if (typeof score !== 'number' || isNaN(score)) return '0%';
        return `${Math.round(score)}%`;
    }, []);

    // Get CSS class based on match percentage
    const getMatchScoreClass = useCallback((score) => {
        if (typeof score !== 'number' || isNaN(score)) return styles.lowMatch;
        if (score >= 80) return styles.highMatch;
        if (score >= 60) return styles.mediumMatch;
        return styles.lowMatch;
    }, []);

    // Handle image error
    const handleImageError = useCallback((boatId) => {
        setImgErrors(prev => ({
            ...prev, [boatId]: true
        }));
    }, []);

    // Create a map to store refs for each image
    const imageRefs = useRef({});

    // Attach ref and error handler to images
    const attachImageRef = useCallback((element, boatId) => {
        if (element) {
            imageRefs.current[boatId] = element;
            element.onerror = () => handleImageError(boatId);
        }
    }, [handleImageError]);

    // Handle retry of match calculations
    const handleRetryMatches = () => {
        // Force recalculation by resetting currentBoatId
        if (matchResultsCache.current) {
            matchResultsCache.current.currentBoatId = null;
        }
        // Clear errors
        setApiErrors([]);
        // Force recalculation by updating the version
        setResultsVersion(v => v + 1);
    };

    // Dismiss all errors
    const handleDismissErrors = () => {
        setApiErrors([]);
    };

    // Render the content based on loading and data states
    const renderContent = () => {
        if (loading) {
            return (<div className={styles.loadingContainer}>
                <p>Calculating matches...</p>
                <div className={styles.loadingSpinner}></div>
            </div>);
        }

        if (displayedBoats.length === 0) {
            return (<div className={styles.noMatches}>
                <p>No similar boats found</p>
                {apiErrors.length > 0 && (
                    <ErrorHandler
                        errors={apiErrors}
                        onRetry={handleRetryMatches}
                        onDismiss={handleDismissErrors}
                        showDetails={showErrorDetails}
                        onToggleDetails={() => setShowErrorDetails(!showErrorDetails)}
                    />
                )}
            </div>);
        }

        return (<div className={styles.boatGrid}>
            {apiErrors.length > 0 && (
                <ErrorHandler
                    errors={apiErrors}
                    onRetry={handleRetryMatches}
                    onDismiss={handleDismissErrors}
                    showDetails={showErrorDetails}
                    onToggleDetails={() => setShowErrorDetails(!showErrorDetails)}
                />
            )}
            {displayedBoats.map(boat => (<button
                key={boat.id}
                className={`${styles.boatCard} ${selectedBoat === boat ? styles.selectedCard : ''}`}
                onClick={() => handleBoatSelect(boat)}
                aria-pressed={selectedBoat === boat}
                aria-label={getBoatAriaLabel(boat)}
                type="button"
            >
                <div className={styles.boatImageContainer}>
                    <img
                        src={imgErrors[boat.id] ? 'https://via.placeholder.com/300x200?text=No+Image' : boat.imageUrl}
                        alt={boat.name}
                        className={styles.boatImage}
                        ref={(el) => attachImageRef(el, boat.id)}
                    />
                    <div className={styles.matchBadge}>
                <span className={getMatchScoreClass(boat.matchScore)}>
                  {formatMatchPercentage(boat.matchScore)} Match
                </span>
                    </div>
                </div>

                <div className={styles.boatInfo}>
                    <h3>{boat.name}</h3>
                    <div className={styles.priceLocation}>
                        {boat.price && <div className={styles.price}>${boat.price.toLocaleString()}</div>}
                        {boat.location && <div className={styles.location}>{boat.location}</div>}
                    </div>

                    <div className={styles.specGrid}>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>Length</div>
                            <div className={styles.specValue}>{boat.length} ft</div>
                        </div>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>Type</div>
                            <div className={styles.specValue}>{boat.type}</div>
                        </div>

                        {boat.engine && (<div className={styles.specItem}>
                            <div className={styles.specLabel}>Engine</div>
                            <div className={styles.specValue}>{boat.engine}</div>
                        </div>)}

                        {boat.hullMaterial && (<div className={styles.specItem}>
                            <div className={styles.specLabel}>Hull</div>
                            <div className={styles.specValue}>{boat.hullMaterial}</div>
                        </div>)}
                    </div>

                    {boat.features && boat.features.length > 0 && (<div className={styles.featuresSection}>
                        <div className={styles.featuresList}>
                            {boat.features.slice(0, 3).map((feature, index) => (
                                <div key={index} className={styles.featureItem}>
                                    {feature}
                                </div>))}
                            {boat.features.length > 3 && (
                                <div className={styles.moreLink}>+{boat.features.length - 3} more</div>)}
                        </div>
                    </div>)}
                </div>
            </button>))}
        </div>);
    };

    const getBoatAriaLabel = (boat) => {
        let label = `Select ${boat.name} for comparison`;

        if (boat.matchScore) {
            const roundedScore = Math.round(boat.matchScore);
            label += `, ${roundedScore}% match`;
        }

        return label;
    };

    // If no current boat is selected, show a message
    if (!currentBoat) {
        return (<div className={styles.similarBoatsContainer}>
            <h2>Similar Boats</h2>
            <p className={styles.noBoatSelected}>Please select a boat to see similar options</p>
        </div>);
    }

    return (<div className={styles.similarBoatsContainer}>
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

        {renderContent()}

        {selectedBoat && (<DetailedComparison
            currentBoat={currentBoat}
            comparisonBoat={selectedBoat}
            onClose={() => setSelectedBoat(null)}
        />)}
    </div>);
};

export default SimilarBoats;

// Add PropTypes validation
SimilarBoats.propTypes = {
    /**
     * The currently selected boat for comparison
     */
    currentBoat: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string,
        length: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        imageUrl: PropTypes.string,
        features: PropTypes.arrayOf(PropTypes.string),
        location: PropTypes.string,
        engine: PropTypes.string,
        hullMaterial: PropTypes.string
    })
};

// Default props
SimilarBoats.defaultProps = {
    currentBoat: null
};
