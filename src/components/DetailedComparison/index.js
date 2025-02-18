import React from 'react';
import styles from './styles.module.css';
import { getFeatureAnalysis } from '../SimilarBoats';

const DetailedComparison = ({ currentBoat, comparisonBoat, onClose }) => {
  const getLengthMatch = () => {
    const currentSize = parseFloat(String(currentBoat.size || currentBoat.length || '0').match(/\d+/)?.[0] || '0');
    const comparisonSize = parseFloat(String(comparisonBoat.size || comparisonBoat.length || '0').match(/\d+/)?.[0] || '0');
    
    if (isNaN(currentSize) || isNaN(comparisonSize)) {
      return {
        currentSize: 'N/A',
        comparisonSize: 'N/A',
        difference: 0,
        matchPercentage: 0
      };
    }

    const lengthDiff = Math.abs(currentSize - comparisonSize);
    const matchPercentage = Math.max(0, 100 - (lengthDiff * 5));
    
    return {
      currentSize,
      comparisonSize,
      difference: lengthDiff,
      matchPercentage: Math.round(matchPercentage)
    };
  };

  const lengthAnalysis = getLengthMatch();
  const featureAnalysis = getFeatureAnalysis(currentBoat, comparisonBoat);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Detailed Comparison</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.boatComparison}>
          <div className={styles.referenceSection}>
            <h3>Your Reference Boat</h3>
            <img src={currentBoat.imageUrl} alt={currentBoat.name} className={styles.boatImage} />
          </div>
          <div className={styles.comparisonSection}>
            <h3>{comparisonBoat.name}</h3>
            <img src={comparisonBoat.imageUrl} alt={comparisonBoat.name} className={styles.boatImage} />
          </div>
        </div>

        <div className={styles.specificationSection}>
          <h3>Key Specifications Comparison</h3>
          
          <div className={styles.specRow}>
            <span>Length</span>
            <div className={styles.specComparison}>
              <span>{lengthAnalysis.currentSize} ft</span>
              <div className={`${styles.matchIndicator} ${lengthAnalysis.matchPercentage >= 80 ? styles.matchGood : styles.matchBad}`}>
                {lengthAnalysis.difference > 0 ? 
                  `(+${lengthAnalysis.difference} ft, ${lengthAnalysis.matchPercentage}% match)` :
                  `(Exact match)`}
                <div className={styles.infoIcon}>?</div>
              </div>
            </div>
          </div>

          <div className={styles.specRow}>
            <span>Hull Material</span>
            <div className={styles.specComparison}>
              <span>{currentBoat.hullMaterial}</span>
              {currentBoat.hullMaterial?.toLowerCase() === comparisonBoat.hullMaterial?.toLowerCase() ? (
                <div className={styles.matchIcon}>Match ✓</div>
              ) : (
                <div className={styles.noMatchIcon}>Different Configuration ×</div>
              )}
            </div>
          </div>

          <div className={styles.specRow}>
            <span>Engine</span>
            <div className={styles.specComparison}>
              <span>{currentBoat.engine}</span>
              {currentBoat.engine === comparisonBoat.engine ? (
                <div className={styles.matchIcon}>Match ✓</div>
              ) : (
                <div className={styles.noMatchIcon}>Different Configuration ×</div>
              )}
            </div>
          </div>

          <div className={styles.specRow}>
            <span>Boat Category</span>
            <div className={styles.specComparison}>
              <span>{currentBoat.type}</span>
              {currentBoat.type?.toLowerCase() === comparisonBoat.type?.toLowerCase() ? (
                <div className={styles.matchIcon}>Match ✓</div>
              ) : (
                <div className={styles.noMatchIcon}>Different Configuration ×</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.featureAnalysis}>
          <h3>Feature Analysis</h3>
          <div className={styles.featureMetrics}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{featureAnalysis.featureMatchRate}%</div>
              <div className={styles.metricLabel}>Feature Match Rate</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{featureAnalysis.commonFeaturesCount}</div>
              <div className={styles.metricLabel}>Common Features</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{featureAnalysis.uniqueFeaturesCount}</div>
              <div className={styles.metricLabel}>Unique Features</div>
            </div>
          </div>

          <div className={styles.featureList}>
            <h4>Common Features:</h4>
            <div className={styles.features}>
              {featureAnalysis.commonFeatures.map(feature => (
                <span key={feature} className={styles.feature} data-type="common">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.uniqueFeatures}>
            <div className={styles.uniqueSection}>
              <h4>Unique to Uploaded Boat</h4>
              <div className={styles.features}>
                {featureAnalysis.uniqueToCurrentBoat.map(feature => (
                  <span key={feature} className={styles.feature} data-type="unique-current">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.uniqueSection}>
              <h4>Unique to Match Boat</h4>
              <div className={styles.features}>
                {featureAnalysis.uniqueToComparisonBoat.map(feature => (
                  <span key={feature} className={styles.feature} data-type="unique-comparison">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedComparison;
