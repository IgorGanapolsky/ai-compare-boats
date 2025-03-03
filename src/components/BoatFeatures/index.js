import React, { useState } from 'react';
import styles from '../SimilarBoats/styles.module.css';

/**
 * Component to display boat features with expandable functionality
 * @param {Object} props - Component props
 * @param {Array} props.features - Array of feature strings
 * @returns {JSX.Element} - Rendered component
 */
const BoatFeatures = ({ features }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle the case where features is not an array
  const safeFeatures = Array.isArray(features) ? features : [];

  const visibleFeatures = isExpanded ? safeFeatures : safeFeatures.slice(0, 4);
  const remainingCount = Math.max(0, safeFeatures.length - 4);

  if (safeFeatures.length === 0) {
    return <div className={styles.features}><span className={styles.noFeatures}>No features listed</span></div>;
  }

  return (
    <div className={styles.features}>
      {visibleFeatures.map((feature, idx) => (
        <span key={`feature-${idx}`} className={styles.feature}>
          {feature}
        </span>
      ))}
      {remainingCount > 0 && (
        <button
          className={styles.moreFeatures}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          +{remainingCount} more
        </button>
      )}
      {isExpanded && (
        <div className={styles.expandedFeatures}>
          {safeFeatures.slice(4).map((feature, idx) => (
            <span key={`expanded-${idx}`} className={styles.feature}>
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoatFeatures;
