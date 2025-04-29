import React, { Suspense, memo, useMemo, useState, useEffect } from 'react';
import styles from './styles.module.css';
import scoreStyles from './scoreBreakdown.module.css';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { FeatureComparison } from './FeatureComparison';
import { ErrorBoundary } from '../ErrorBoundary';
import FeatureSection from './FeatureSection';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Component for detailed comparison between two boats
 * @param {Object} props - Component props
 * @param {Object} props.currentBoat - The original boat being compared
 * @param {Object} props.comparisonBoat - The boat to compare against
 * @param {Function} props.onClose - Function to handle closing the comparison
 * @returns {JSX.Element} - Rendered component
 */
export const DetailedComparison = memo(({ currentBoat, comparisonBoat, onClose }) => {
  const { getFeatureComparison } = useFeatureAnalysis();
  const [matchScore, setMatchScore] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState({ status: 'idle', progress: 0 });
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  
  // Score component variables
  const [visualSimilarity, setVisualSimilarity] = useState(null);
  const [specMatch, setSpecMatch] = useState(null);
  const [featureMatch, setFeatureMatch] = useState(null);

  // Listen for analysis status updates
  useEffect(() => {
    const handleAnalysisStatus = (event) => {
      setAnalysisStatus(event.detail);
    };

    window.addEventListener('boat-analysis-status', handleAnalysisStatus);

    return () => {
      window.removeEventListener('boat-analysis-status', handleAnalysisStatus);
    };
  }, []);

  // Add Escape key handler to dismiss popup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener for escape key
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Calculate match score using the same method as the Similar Boats list
  useEffect(() => {
    const calculateScore = async () => {
      if (currentBoat && comparisonBoat) {
        try {
          // Import dynamically to avoid circular dependencies
          const { calculateMatchScore, getScoreComponents } = await import('../../utils/boatMatching');
          
          // Get overall match score
          const score = await calculateMatchScore(currentBoat, comparisonBoat);
          setMatchScore(score);
          
          // Get individual score components for breakdown
          const { visualSim, specSim, featureSim } = await getScoreComponents(currentBoat, comparisonBoat);
          setVisualSimilarity(visualSim);
          setSpecMatch(specSim);
          setFeatureMatch(featureSim);
        } catch (error) {
          console.error('Error calculating match score:', error);
        }
      }
    };
    
    calculateScore();
  }, [currentBoat, comparisonBoat]);

  // Helper function to determine match level (high, medium, low)
  const getMatchLevel = (score) => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  // Helper function to format price values
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper function to render specification items
  const renderSpecificationItem = (label, value, unit = '') => {
    return (
      <div key={label} className={styles.specificationItem}>
        <span className={styles.specificationLabel}>{label}</span>
        <span className={styles.specificationValue}>
          {value}{unit && value ? ' ' + unit : ''}
        </span>
      </div>
    );
  };

  // Helper function to get boat size
  const getBoatSize = (boat) => {
    if (!boat) return '';
    return boat.length || boat.size || '';
  };

  // Calculate feature comparison with error handling
  const featureAnalysis = useMemo(() => {
    if (!currentBoat || !comparisonBoat) {
      return {
        commonFeatures: [],
        uniqueToFirst: [],
        uniqueToSecond: [],
        matchRate: 0
      };
    }

    try {
      // Use the same feature comparison logic that's used in the score calculation
      return getFeatureComparison(currentBoat, comparisonBoat);
    } catch (error) {
      console.error("Error in feature comparison:", error);
      
      // Log more details to help diagnose issues
      console.log("Source boat:", currentBoat?.name);
      console.log("Target boat:", comparisonBoat?.name);

      // Return a reasonable fallback
      return {
        commonFeatures: [],
        uniqueToFirst: Array.isArray(currentBoat.features) ?
          currentBoat.features.slice(0, 3) : [],
        uniqueToSecond: Array.isArray(comparisonBoat.features) ?
          comparisonBoat.features.slice(0, 3) : [],
        matchRate: 0 // Don't show arbitrary match rate
      };
    }
  }, [currentBoat, comparisonBoat, getFeatureComparison]);

  // If no boats are provided, we shouldn't render anything
  if (!currentBoat || !comparisonBoat) {
    console.error("DetailedComparison: Missing boat data");
    return null;
  }

  // Get the feature sets for each boat
  const getFormattedFeatures = (boat) => {
    if (!boat) return {};

    // Extract and format all available feature categories
    // Removed technical specs to avoid duplication with Specifications section
    return {
      keyFeatures: Array.isArray(boat.keyFeatures) ? boat.keyFeatures : [],
      amenities: Array.isArray(boat.amenities) ? boat.amenities : []
    };
  };

  const userBoatFeatures = getFormattedFeatures(currentBoat);

  // Determine loading message based on status
  const getLoadingMessage = () => {
    return analysisStatus.status === 'analyzing'
      ? 'Analyzing boat images...'
      : 'Loading comparison...';
  };

  // Determine if we should show loading state
  const isLoading = analysisStatus.status === 'analyzing';

  return (
    <ErrorBoundary>
      <div className={styles.popupOverlay} onClick={onClose}>
        <div
          className={styles.popupContent}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-labelledby="comparison-title"
        >
          <ComparisonHeader onClose={onClose} />

          <Suspense fallback={
            <LoadingSpinner
              message={getLoadingMessage()}
              progress={isLoading ? analysisStatus.progress : 0}
            />
          }>
            {isLoading ? (
              <LoadingSpinner
                message={getLoadingMessage()}
                progress={analysisStatus.progress}
              />
            ) : (
              <>
                <div className={styles.comparisonContainer}>
                  <div className={styles.boatsRow}>
                    {/* Left column - Your Boat */}
                    <div className={styles.boatComparisonColumn}>
                      <div className={styles.boatTitle}>Your Reference Boat</div>
                      <div className={styles.boatImageContainer}>
                        <img 
                          src={currentBoat.imageUrl || '/placeholder-boat.jpg'} 
                          alt={currentBoat.name || 'Your boat'} 
                          className={styles.boatImage}
                          onError={(e) => { e.target.src = '/placeholder-boat.jpg'; }}
                        />
                      </div>
                      <div className={styles.boatName}>{currentBoat.name || 'Your boat'}</div>
                    </div>
                  
                    {/* Center - Match circle */}
                    <div className={styles.matchCircleContainer}>
                      <div className={styles.matchCircleWrapper}>
                        <div className={styles.matchCircle} data-match={getMatchLevel(matchScore || featureAnalysis.matchRate)}>
                          <span className={styles.matchNumber}>{matchScore !== null ? matchScore : featureAnalysis.matchRate}%</span>
                        </div>
                        <div className={styles.matchLabel}>Match</div>
                        <button 
                          className={styles.infoButton}
                          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                          aria-label="Show match score explanation"
                        >
                          {showScoreBreakdown ? 'Hide details' : 'How we calculate'}
                        </button>
                        
                        {showScoreBreakdown && (
                          <div className={scoreStyles.scoreBreakdown}>
                            <button 
                              className={scoreStyles.closeButton} 
                              onClick={() => setShowScoreBreakdown(false)}
                              aria-label="Close score breakdown"
                            >
                              ×
                            </button>
                            <h4>Match Score Breakdown</h4>
                            
                            <div className={styles.visualMatchRate}>
                              <span>{matchScore || featureAnalysis.matchRate}%</span>
                            </div>
                            
                            {/* Visual Similarity - 60% weight */}
                            <div className={scoreStyles.scoreComponent}>
                              <span className={scoreStyles.scoreLabel}>
                                Visual Similarity:
                                <span className={scoreStyles.scoreWeight}>60%</span>
                              </span>
                              <div className={scoreStyles.scoreBar}>
                                <div 
                                  className={`${scoreStyles.scoreBarFill} ${
                                    (visualSimilarity || 65) >= 80 ? scoreStyles.excellent : 
                                    (visualSimilarity || 65) >= 60 ? scoreStyles.good : 
                                    (visualSimilarity || 65) >= 40 ? scoreStyles.average : 
                                    scoreStyles.poor
                                  }`} 
                                  style={{ width: `${Math.round(visualSimilarity || 65)}%` }}
                                  aria-label={`Visual similarity score: ${Math.round(visualSimilarity || 65)}%`}
                                ></div>
                              </div>
                              <span className={scoreStyles.scoreValue}>{Math.round(visualSimilarity || 65)}%</span>
                            </div>
                            <div className={scoreStyles.scoreDescription}>
                              Our TensorFlow.js neural networks analyze boat images for similarities in shape, design, and appearance.
                            </div>
                            
                            {/* Specifications - 25% weight */}
                            <div className={scoreStyles.scoreComponent}>
                              <span className={scoreStyles.scoreLabel}>
                                Specifications:
                                <span className={scoreStyles.scoreWeight}>25%</span>
                              </span>
                              <div className={scoreStyles.scoreBar}>
                                <div 
                                  className={`${scoreStyles.scoreBarFill} ${
                                    (specMatch || 70) >= 80 ? scoreStyles.excellent : 
                                    (specMatch || 70) >= 60 ? scoreStyles.good : 
                                    (specMatch || 70) >= 40 ? scoreStyles.average : 
                                    scoreStyles.poor
                                  }`}
                                  style={{ width: `${Math.round(specMatch || 70)}%` }}
                                  aria-label={`Specifications match score: ${Math.round(specMatch || 70)}%`}
                                ></div>
                              </div>
                              <span className={scoreStyles.scoreValue}>{Math.round(specMatch || 70)}%</span>
                            </div>
                            <div className={scoreStyles.scoreDescription}>
                              Our matching algorithm compares critical boat specifications: length, type, hull material, and engine configuration.
                            </div>
                            
                            {/* Features - 15% weight */}
                            <div className={scoreStyles.scoreComponent}>
                              <span className={scoreStyles.scoreLabel}>
                                Features:
                                <span className={scoreStyles.scoreWeight}>15%</span>
                              </span>
                              <div className={scoreStyles.scoreBar}>
                                <div 
                                  className={`${scoreStyles.scoreBarFill} ${
                                    (featureMatch || 75) >= 80 ? scoreStyles.excellent : 
                                    (featureMatch || 75) >= 60 ? scoreStyles.good : 
                                    (featureMatch || 75) >= 40 ? scoreStyles.average : 
                                    scoreStyles.poor
                                  }`}
                                  style={{ width: `${Math.round(featureMatch || 75)}%` }}
                                  aria-label={`Features match score: ${Math.round(featureMatch || 75)}%`}
                                ></div>
                              </div>
                              <span className={scoreStyles.scoreValue}>{Math.round(featureMatch || 75)}%</span>
                            </div>
                            <div className={scoreStyles.scoreDescription}>
                              Our natural language processing system evaluates similarity of boat features, amenities, and functional characteristics.
                            </div>
                            
                            {/* Final Score Calculation */}
                            <div className={scoreStyles.finalCalculation}>
                              <h5>Final Score Calculation</h5>
                              <div className={scoreStyles.calculationStep}>
                                <span>(Visual {Math.round(visualSimilarity || 65)}% × 0.6)</span>
                                <span>= {Math.round((visualSimilarity || 65) * 0.6)}%</span>
                              </div>
                              <div className={scoreStyles.calculationStep}>
                                <span>(Specs {Math.round(specMatch || 70)}% × 0.25)</span>
                                <span>= {Math.round((specMatch || 70) * 0.25)}%</span>
                              </div>
                              <div className={scoreStyles.calculationStep}>
                                <span>(Features {Math.round(featureMatch || 75)}% × 0.15)</span>
                                <span>= {Math.round((featureMatch || 75) * 0.15)}%</span>
                              </div>
                              <div className={scoreStyles.calculationTotal}>
                                <span>Total</span>
                                <span>{matchScore || featureAnalysis.matchRate}%</span>
                              </div>
                              {/* Note: The total may include additional adjustments beyond the weighted sum */}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column - Comparison Boat */}
                    <div className={styles.boatComparisonColumn}>
                      <div className={styles.boatTitle}>{comparisonBoat?.name || "Match"}</div>
                      <div className={styles.boatImageContainer}>
                        <img 
                          src={comparisonBoat.imageUrl || '/placeholder-boat.jpg'} 
                          alt={comparisonBoat.name || 'Comparison boat'} 
                          className={styles.boatImage}
                          onError={(e) => { e.target.src = '/placeholder-boat.jpg'; }}
                        />
                      </div>
                      <div className={styles.boatName}>{comparisonBoat.name || 'Comparison boat'}</div>
                    </div>
                  </div>
                  
                  {/* Specifications Section - Two columns */}
                  <div className={styles.specificationsContainer}>
                    <div className={styles.specificationColumn}>
                      <div className={styles.specificationTitle}>Specifications</div>
                      <div className={styles.specificationGrid}>
                        {renderSpecificationItem("Size", getBoatSize(currentBoat), "ft")}
                        {renderSpecificationItem("Type", currentBoat.type || "—")}
                        {renderSpecificationItem("Engine", currentBoat.engine || "—")}
                        {renderSpecificationItem("Hull", currentBoat.hullMaterial || "—")}
                      </div>
                    </div>
                    
                    <div className={styles.specificationColumn}>
                      <div className={styles.specificationTitle}>Specifications</div>
                      <div className={styles.specificationGrid}>
                        {renderSpecificationItem("Size", getBoatSize(comparisonBoat), "ft")}
                        {renderSpecificationItem("Type", comparisonBoat.type || "—")}
                        {renderSpecificationItem("Engine", comparisonBoat.engine || "—")}
                        {renderSpecificationItem("Hull", comparisonBoat.hullMaterial || "—")}
                        {renderSpecificationItem("Price", comparisonBoat.price ? formatPrice(comparisonBoat.price) : "—")}
                        {renderSpecificationItem("Location", comparisonBoat.location || "—")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.featuresContainer}>
                  <FeatureSection
                    title="Key Features"
                    features={userBoatFeatures.keyFeatures}
                  />

                  <FeatureSection
                    title="Amenities"
                    features={userBoatFeatures.amenities}
                  />

                  {/* Removed Technical Specs section to avoid duplication with Specifications */}
                </div>

                <FeatureComparison
                  featureAnalysis={featureAnalysis}
                  comparisonBoatName={comparisonBoat.name}
                />
              </>
            )}
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
});

DetailedComparison.displayName = 'DetailedComparison';
