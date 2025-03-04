import React from 'react';
import styles from './styles.module.css';
import { isBoston345Conquest } from '../../utils/boatMatching';
import { useFeatureAnalysis } from '../../hooks/useFeatureAnalysis';
import { ComparisonHeader } from './ComparisonHeader';
import { BoatColumn } from './BoatColumn';
import { FeatureComparison } from './FeatureComparison';
import { ErrorBoundary } from '../ErrorBoundary';
import type { DetailedComparisonProps } from './types';

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
        <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
          <ComparisonHeader onClose={onClose} />

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
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DetailedComparison;
