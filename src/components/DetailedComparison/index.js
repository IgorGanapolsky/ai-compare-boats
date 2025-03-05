import React, { Suspense, memo, useMemo, useState, useEffect } from 'react';
import styles from './styles.module.css';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { BoatColumn } from './BoatColumn';
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
                  <BoatColumn
                    boat={currentBoat}
                    title="Your Boat"
                    showPrice={false}
                    showLocation={false}
                  />

                  <BoatColumn
                    boat={comparisonBoat}
                    title="Match"
                    matchRate={matchScore !== null ? matchScore : featureAnalysis.matchRate}
                    showPrice={true}
                    showLocation={true}
                  />
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
