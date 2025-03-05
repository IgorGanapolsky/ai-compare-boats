import React, { useState } from 'react';
import './FeatureList.css'; // Assuming there's a CSS file for styling

/**
 * Component to display a list of features with a show more/less toggle
 * @param {Object} props - Component props
 * @param {Array<string>} props.features - List of features to display
 * @param {number} props.maxInitialFeatures - Maximum number of features to show initially
 */
const FeatureList = ({ features = [], maxInitialFeatures = 3 }) => {
    const [expanded, setExpanded] = useState(false);

    // If no features or empty array, return null
    if (!features || features.length === 0) {
        return null;
    }

    const visibleFeatures = expanded ? features : features.slice(0, maxInitialFeatures);
    const hasMoreFeatures = features.length > maxInitialFeatures;

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    return (
        <span className="styles_featureList">
            <span>
                {visibleFeatures.map((feature, index) => (
                    <span key={index} className="feature-item">
                        • {feature}
                    </span>
                ))}
            </span>

            {hasMoreFeatures && (
                <span
                    className="styles_moreFeaturesButton"
                    onClick={toggleExpanded}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            toggleExpanded();
                            e.preventDefault();
                        }
                    }}
                >
                    {expanded ? 'Show Less' : `+${features.length - maxInitialFeatures} more features`}
                </span>
            )}
        </span>
    );
};

export default FeatureList; 