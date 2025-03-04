import React from 'react';
import styles from './styles.module.css';

const FeatureList = ({ features, emptyMessage, featureClassName }) => (
    <ul className={styles.featureList}>
        {features.length > 0 ? (
            features.map((feature, index) => (
                <li key={`feature-${index}`} className={styles[featureClassName]}>
                    {feature}
                </li>
            ))
        ) : (
            <li className={styles.noFeatures}>{emptyMessage}</li>
        )}
    </ul>
);

export const FeatureComparison = ({ featureAnalysis, comparisonBoatName }) => (
    <div className={styles.featureComparison}>
        <h3>Feature Comparison</h3>

        <div className={styles.featureCategories}>
            <div className={styles.featureCategory}>
                <h4>Common Features</h4>
                <FeatureList
                    features={featureAnalysis.commonFeatures}
                    emptyMessage="No common features found"
                    featureClassName="commonFeature"
                />
            </div>

            <div className={styles.featureCategory}>
                <h4>Only in Your Boat</h4>
                <FeatureList
                    features={featureAnalysis.uniqueToUploaded}
                    emptyMessage="No unique features"
                    featureClassName="uniqueFeature1"
                />
            </div>

            <div className={styles.featureCategory}>
                <h4>Only in {comparisonBoatName}</h4>
                <FeatureList
                    features={featureAnalysis.uniqueToMatch}
                    emptyMessage="No unique features"
                    featureClassName="uniqueFeature2"
                />
            </div>
        </div>
    </div>
); 