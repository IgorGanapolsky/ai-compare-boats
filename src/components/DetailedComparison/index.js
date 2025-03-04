import React, { Suspense } from 'react';
import styles from './styles.module.css';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { BoatColumn } from './BoatColumn';
import { FeatureComparison } from './FeatureComparison';
import { ErrorBoundary } from '../ErrorBoundary';
import type { DetailedComparisonProps } from './types';

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
const DetailedComparison: React.FC<DetailedComparisonProps> = ({ currentBoat, comparisonBoat, onClose }) => {
  const featureAnalysis = useFeatureAnalysis(currentBoat, comparisonBoat);

  if (!currentBoat || !comparisonBoat) {
    return null;
  }

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

            <FeatureComparison
              featureAnalysis={featureAnalysis}
              comparisonBoatName={comparisonBoat.name}
            />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DetailedComparison;
