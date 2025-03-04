import React, { memo } from 'react';
import styles from './styles.module.css';

const FeatureList = memo(({ features, emptyMessage, featureClassName }) => (
    <ul className={styles.featureList} role="list">
        {features.length > 0 ? (
            features.map((feature, index) => (
                <li
                    key={`${feature}-${index}`}
                    className={styles[featureClassName]}
                    role="listitem"
                >
                    {feature}
                </li>
            ))
        ) : (
            <li className={styles.noFeatures} role="listitem">{emptyMessage}</li>
        )}
    </ul>
));
FeatureList.displayName = 'FeatureList';

const FeatureCategory = memo(({ title, features, emptyMessage, featureClassName }) => (
    <div className={styles.featureCategory}>
        <h4>{title}</h4>
        <FeatureList
            features={features}
            emptyMessage={emptyMessage}
            featureClassName={featureClassName}
        />
    </div>
));
FeatureCategory.displayName = 'FeatureCategory';

export const FeatureComparison = memo(({ featureAnalysis, comparisonBoatName }) => (
    <div className={styles.featureComparison}>
        <h3>Feature Comparison</h3>

        <div className={styles.featureCategories}>
            <FeatureCategory
                title="Common Features"
                features={featureAnalysis.commonFeatures}
                emptyMessage="No common features found"
                featureClassName="commonFeature"
            />

            <FeatureCategory
                title="Only in Your Boat"
                features={featureAnalysis.uniqueToUploaded}
                emptyMessage="No unique features"
                featureClassName="uniqueFeature1"
            />

            <FeatureCategory
                title={`Only in ${comparisonBoatName}`}
                features={featureAnalysis.uniqueToMatch}
                emptyMessage="No unique features"
                featureClassName="uniqueFeature2"
            />
        </div>
    </div>
));
FeatureComparison.displayName = 'FeatureComparison'; 