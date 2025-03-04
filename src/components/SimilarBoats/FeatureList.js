import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

/**
 * Component for displaying a list of features with an expand/collapse toggle
 * 
 * @param {Object} props Component props
 * @param {Array} props.features Array of feature strings to display
 * @param {number} props.maxInitialFeatures Maximum number of features to show initially
 * @returns {JSX.Element} Rendered component
 */
const FeatureList = ({ features, maxInitialFeatures = 3 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!features || features.length === 0) {
        return null;
    }

    const hasMore = features.length > maxInitialFeatures;
    const displayedFeatures = expanded ? features : features.slice(0, maxInitialFeatures);
    const hiddenCount = features.length - maxInitialFeatures;

    return (
        <div className={styles.featuresList}>
            {displayedFeatures.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                    {feature}
                </div>
            ))}

            {hasMore && (
                <button
                    className={styles.moreFeaturesButton}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the boat card click
                        setExpanded(!expanded);
                    }}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Show less' : `+${hiddenCount} more`}
                </button>
            )}
        </div>
    );
};

FeatureList.propTypes = {
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    maxInitialFeatures: PropTypes.number
};

FeatureList.defaultProps = {
    maxInitialFeatures: 3
};

export default FeatureList; 