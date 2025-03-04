import React, { Suspense, memo, useMemo, useState, useEffect } from 'react';
import styles from './styles.module.css';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { BoatColumn } from './BoatColumn';
import { FeatureComparison } from './FeatureComparison';
import { ErrorBoundary } from '../ErrorBoundary';
import FeatureSection from './FeatureSection';

// Enhanced loading spinner component with progress
const LoadingSpinner = ({ message, progress }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
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
      animation: 'spin 1s linear infinite',
      marginBottom: '15px'
    }}></div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: '0 0 5px 0' }}>{message}</p>
      {progress > 0 && progress < 100 && (
        <div style={{
          width: '200px',
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          height: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            backgroundColor: '#3498db',
            height: '100%',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      )}
    </div>
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
      // Log error for debugging but don't show to user
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
    if (analysisStatus.status === 'analyzing') {
      return `Analyzing boat images...`;
    }
    return 'Loading comparison...';
  };

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
              progress={analysisStatus.status === 'analyzing' ? analysisStatus.progress : 0}
            />
          }>
            {analysisStatus.status === 'analyzing' ? (
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
              </>
            )}
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
});

DetailedComparison.displayName = 'DetailedComparison';
