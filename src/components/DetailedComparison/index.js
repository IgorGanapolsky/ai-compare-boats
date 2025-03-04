import React, { Suspense, memo, useMemo } from 'react';
import styles from './styles.module.css';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { BoatColumn } from './BoatColumn';
import { FeatureComparison } from './FeatureComparison';
import { ErrorBoundary } from '../ErrorBoundary';
import FeatureSection from './FeatureSection';

// Simple inline LoadingSpinner component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '5px solid #f3f3f3',
      borderTop: '5px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

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
      return {
        commonFeatures: [],
        uniqueToFirst: [],
        uniqueToSecond: [],
        matchRate: 50 // Fallback value
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

          <Suspense fallback={<LoadingSpinner />}>
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
                matchRate={featureAnalysis.matchRate}
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
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
});

DetailedComparison.displayName = 'DetailedComparison';
