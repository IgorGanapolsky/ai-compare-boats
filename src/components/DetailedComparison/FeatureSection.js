import React, { useState, memo } from 'react';
import styles from './styles.module.css';

// Section oval component for section headers
const SectionOval = memo(({ children }) => (
    <div className={styles.sectionOval}>
        {children}
    </div>
));
SectionOval.displayName = 'SectionOval';

/**
 * Feature section component with expandable list
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {Array} props.features - List of features to display
 * @param {number} props.initialCount - Number of features to show initially (default: 5)
 */
const FeatureSection = memo(({ title, features = [], initialCount = 5 }) => {
    const [expanded, setExpanded] = useState(false);

    // If no features or empty array, don't render anything
    if (!features || features.length === 0) return null;

    const hasMore = features.length > initialCount;
    const displayedFeatures = expanded ? features : features.slice(0, initialCount);
    const hiddenCount = features.length - initialCount;

    return (
        <div className={styles.featureSection}>
            <SectionOval>{title}</SectionOval>

            <div className={styles.featureList}>
                {displayedFeatures.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                        {feature}
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    className={styles.expandButton}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                >
                    <span className={styles.expandIcon}>
                        {expanded ? '−' : '+'}
                    </span>
                    {expanded ? 'Show less' : `${hiddenCount} more features`}
                </button>
            )}
        </div>
    );
});
FeatureSection.displayName = 'FeatureSection';

export default FeatureSection; 