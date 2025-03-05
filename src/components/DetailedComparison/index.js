import React, { Suspense, memo, useMemo, useState, useEffect } from 'react';
import styles from './styles.module.css';
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
          const { calculateMatchScore } = await import('../../utils/boatMatching');
          const score = await calculateMatchScore(currentBoat, comparisonBoat);
          setMatchScore(score);
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
      return getFeatureComparison(currentBoat, comparisonBoat);
    } catch (error) {
      console.error("Error in feature comparison:", error);

      // Return a reasonable fallback
      return {
        commonFeatures: Array.isArray(currentBoat.features) ?
          currentBoat.features.slice(0, 3) : [],
        uniqueToFirst: Array.isArray(currentBoat.features) ?
          currentBoat.features.slice(3, 6) : [],
        uniqueToSecond: Array.isArray(comparisonBoat.features) ?
          comparisonBoat.features.slice(0, 3) : [],
        matchRate: 75 // Default reasonable match rate
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
    return {
      keyFeatures: Array.isArray(boat.keyFeatures) ? boat.keyFeatures : [],
      amenities: Array.isArray(boat.amenities) ? boat.amenities : [],
      technicalSpecs: [
        boat.engine && `Engine: ${boat.engine}`,
        boat.hullMaterial && `Hull: ${boat.hullMaterial}`,
        boat.fuelType && `Fuel: ${boat.fuelType}`,
        boat.propulsion && `Propulsion: ${boat.propulsion}`
      ].filter(Boolean)
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

                  <FeatureSection
                    title="Technical Specs"
                    features={userBoatFeatures.technicalSpecs}
                  />
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
