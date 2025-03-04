import React, { memo } from 'react';
import styles from './styles.module.css';
import FeatureSection from './FeatureSection';

/**
 * Displays a comparison of features between two boats
 * 
 * @param {Object} props - Component props
 * @param {Object} props.featureAnalysis - Analysis of feature comparison
 * @param {Array} props.featureAnalysis.commonFeatures - Features common to both boats
 * @param {Array} props.featureAnalysis.uniqueToFirst - Features unique to the first boat
 * @param {Array} props.featureAnalysis.uniqueToSecond - Features unique to the second boat
 * @param {string} props.comparisonBoatName - Name of the boat being compared
 * @returns {JSX.Element} - Rendered component
 */
export const FeatureComparison = memo(({ featureAnalysis, comparisonBoatName }) => {
    // Handle missing or invalid analysis
    const {
        commonFeatures = [],
        uniqueToFirst = [],
        uniqueToSecond = []
    } = featureAnalysis || {};

    return (
        <div className={styles.featureComparisonSection}>
            <h3 className={styles.comparisonSectionTitle}>Feature Comparison</h3>

            <div className={styles.comparisonColumns}>
                <div className={styles.comparisonColumn}>
                    <FeatureSection
                        title="Common Features"
                        features={commonFeatures}
                    />
                </div>

                <div className={styles.comparisonColumn}>
                    <FeatureSection
                        title="Only in Your Boat"
                        features={uniqueToFirst}
                    />
                </div>

                <div className={styles.comparisonColumn}>
                    <FeatureSection
                        title={`Only in ${comparisonBoatName || 'Comparison Boat'}`}
                        features={uniqueToSecond}
                    />
                </div>
            </div>
        </div>
    );
});

FeatureComparison.displayName = 'FeatureComparison'; 