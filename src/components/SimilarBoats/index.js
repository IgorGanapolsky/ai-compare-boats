import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAllBoats } from '../../hooks/useAllBoats';
import styles from './styles.module.css';
import { calculateMatchScore } from '../../utils/boatMatching';
import { DetailedComparison } from '../DetailedComparison';
import ErrorHandler from '../ErrorHandler';
import LoadingSpinner from '../ui/LoadingSpinner';
import FeatureList from './FeatureList';
import BoatCard from './BoatCard';

/**
 * Custom hook for boat match calculations
 */
const useBoatMatching = (currentBoat, filteredBoats) => {
    const [loading, setLoading] = useState(false);
    const [apiErrors, setApiErrors] = useState([]);
    const [resultsVersion, setResultsVersion] = useState(0);
    const [filteredResults, setFilteredResults] = useState([]);

    // Cache for storing calculated match results
    const matchResultsCache = useRef({
        currentBoatId: null,
        results: []
    });

    // Update derived state when cache or version changes
    useEffect(() => {
        setFilteredResults(matchResultsCache.current.results);
    }, [resultsVersion]);

    // Calculate match scores asynchronously when the current boat changes
    useEffect(() => {
        const calculateMatches = async () => {
            if (!currentBoat || filteredBoats.length === 0) {
                matchResultsCache.current = { currentBoatId: null, results: [] };
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

                // Update the cache with full results
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
                matchResultsCache.current = { currentBoatId: null, results: [] };
                setResultsVersion(v => v + 1); // Increment version to trigger re-render
            } finally {
                setLoading(false);
            }
        };

        calculateMatches();
    }, [currentBoat, filteredBoats]);

    // Handle retry of match calculations
    const handleRetryMatches = useCallback(() => {
        // Force recalculation by resetting currentBoatId
        if (matchResultsCache.current) {
            matchResultsCache.current.currentBoatId = null;
        }
        // Clear errors
        setApiErrors([]);
        // Force recalculation by updating the version
        setResultsVersion(v => v + 1);
    }, []);

    // Dismiss all errors
    const handleDismissErrors = useCallback(() => {
        setApiErrors([]);
    }, []);

    return {
        loading,
        apiErrors,
        filteredResults,
        handleRetryMatches,
        handleDismissErrors
    };
};

/**
 * Custom hook for handling analysis status
 */
const useAnalysisStatus = () => {
    const [analysisStatus, setAnalysisStatus] = useState({ status: 'idle', progress: 0 });

    // Add an effect to listen for analysis status events
    useEffect(() => {
        const handleAnalysisStatus = (event) => {
            setAnalysisStatus(event.detail);
        };

        window.addEventListener('boat-analysis-status', handleAnalysisStatus);

        return () => {
            window.removeEventListener('boat-analysis-status', handleAnalysisStatus);
        };
    }, []);

    return analysisStatus;
};

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
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [imgErrors, setImgErrors] = useState({});

    // Custom hooks
    const { allBoats } = useAllBoats();
    const analysisStatus = useAnalysisStatus();

    // Get potential similar boats excluding the current boat
    const filteredBoats = useMemo(() => {
        if (!currentBoat || !allBoats) return [];
        return allBoats.filter(boat => boat.id !== currentBoat.id);
    }, [currentBoat, allBoats]);

    // Use our custom boat matching hook
    const {
        loading,
        apiErrors,
        filteredResults,
        handleRetryMatches,
        handleDismissErrors
    } = useBoatMatching(currentBoat, filteredBoats);

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

    // Handle sort change
    const handleSortChange = useCallback((e) => {
        setSortBy(e.target.value);
    }, []);

    // Handle boat selection for detailed comparison
    const handleBoatSelect = useCallback((boat) => {
        setSelectedBoat(prev => prev === boat ? null : boat);
    }, []);

    // Handle image error
    const handleImageError = useCallback((boatId) => {
        setImgErrors(prev => ({
            ...prev,
            [boatId]: true
        }));
    }, []);

    // Render the content based on loading and data states
    const renderContent = () => {
        // Show unified loading state for both calculations and image analysis
        if (loading || analysisStatus.status === 'analyzing') {
            const message = analysisStatus.status === 'analyzing'
                ? `Analyzing boat images... ${analysisStatus.progress}%`
                : 'Finding similar boats...';

            return (
                <LoadingSpinner
                    message={message}
                    progress={analysisStatus.status === 'analyzing' ? analysisStatus.progress : 0}
                />
            );
        }

        if (displayedBoats.length === 0) {
            return (
                <div className={styles.noMatches}>
                    <p>No similar boats found</p>
                    {/* Only show errors in development, not for end users */}
                    {process.env.NODE_ENV === 'development' && apiErrors.length > 0 && (
                        <ErrorHandler
                            errors={apiErrors}
                            onRetry={handleRetryMatches}
                            onDismiss={handleDismissErrors}
                            showDetails={showErrorDetails}
                            onToggleDetails={() => setShowErrorDetails(!showErrorDetails)}
                        />
                    )}
                </div>
            );
        }

        return (
            <div className={styles.boatGrid}>
                {/* Only show errors in development, not for end users */}
                {process.env.NODE_ENV === 'development' && apiErrors.length > 0 && (
                    <ErrorHandler
                        errors={apiErrors}
                        onRetry={handleRetryMatches}
                        onDismiss={handleDismissErrors}
                        showDetails={showErrorDetails}
                        onToggleDetails={() => setShowErrorDetails(!showErrorDetails)}
                    />
                )}

                {displayedBoats.map(boat => (
                    <BoatCard
                        key={boat.id}
                        boat={boat}
                        selected={selectedBoat === boat}
                        onSelect={() => handleBoatSelect(boat)}
                        onImageError={() => handleImageError(boat.id)}
                        hasImageError={imgErrors[boat.id]}
                    />
                ))}
            </div>
        );
    };

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

            {renderContent()}

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
