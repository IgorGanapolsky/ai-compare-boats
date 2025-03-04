import React, { useMemo } from 'react';
import styles from './styles.module.css';
import { isBoston345Conquest } from '../../utils/boatMatching';

/**
 * Component for detailed comparison between two boats
 * @param {Object} props - Component props
 * @param {Object} props.currentBoat - The original boat being compared
 * @param {Object} props.comparisonBoat - The boat to compare against
 * @param {Function} props.onClose - Function to handle closing the comparison
 * @returns {JSX.Element} - Rendered component
 */
const DetailedComparison = ({ currentBoat, comparisonBoat, onClose }) => {
  /**
   * Analyzes the features of both boats to find commonalities and differences
   * @returns {Object} - Analysis results with match rate and feature lists
   */
  const featureAnalysis = useMemo(() => {
    if (!currentBoat || !comparisonBoat) {
      return {
        matchRate: 0,
        commonFeatures: [],
        uniqueToUploaded: [],
        uniqueToMatch: []
      };
    }

    // Normalize feature text for better matching
    const normalizeFeature = (feature) => {
      if (typeof feature !== 'string') return '';

      return feature.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\b(for|with|and|the|a|an|to|in|on|of)\b/g, '')
        .trim();
    };

    // Extract all features from a boat object
    const extractFeaturesFromBoat = (boat) => {
      const features = new Set();

      if (!boat) return features;

      // Collect features from all possible feature sources
      if (Array.isArray(boat.features)) {
        boat.features.forEach(f => {
          const normalized = normalizeFeature(f);
          if (normalized) features.add(normalized);
        });
      }

      if (Array.isArray(boat.keyFeatures)) {
        boat.keyFeatures.forEach(f => {
          const normalized = normalizeFeature(f);
          if (normalized) features.add(normalized);
        });
      }

      if (Array.isArray(boat.style)) {
        boat.style.forEach(s => {
          const normalized = normalizeFeature(s);
          if (normalized) features.add(normalized);
        });
      }

      return features;
    };

    // Check if two features are similar
    const areSimilarFeatures = (feature1, feature2) => {
      // Exact match
      if (feature1 === feature2) return true;

      // One contains the other
      if (feature1.includes(feature2) || feature2.includes(feature1)) return true;

      // Split into words and check for common words
      const words1 = feature1.split(/\s+/).filter(Boolean);
      const words2 = feature2.split(/\s+/).filter(Boolean);

      // Empty features shouldn't match
      if (words1.length === 0 || words2.length === 0) return false;

      // Calculate word overlap
      const commonWords = words1.filter(word =>
        words2.some(w2 => w2.includes(word) || word.includes(w2))
      );

      // Calculate similarity score
      const similarityScore = commonWords.length / Math.max(words1.length, words2.length);

      // Consider features similar if they share enough words
      return similarityScore >= 0.5;
    };

    // Get all features from both boats
    const currentFeatures = extractFeaturesFromBoat(currentBoat);
    const comparisonFeatures = extractFeaturesFromBoat(comparisonBoat);

    // Find common and unique features
    const commonFeatures = [...currentFeatures].filter(feature =>
      [...comparisonFeatures].some(compFeature => areSimilarFeatures(feature, compFeature))
    );

    const uniqueToUploaded = [...currentFeatures].filter(feature =>
      ![...comparisonFeatures].some(compFeature => areSimilarFeatures(feature, compFeature))
    );

    const uniqueToMatch = [...comparisonFeatures].filter(feature =>
      ![...currentFeatures].some(currFeature => areSimilarFeatures(feature, currFeature))
    );

    // Calculate match percentage - for UI only, main score comes from calculateMatchScore
    const totalFeatures = commonFeatures.length + uniqueToUploaded.length + uniqueToMatch.length;
    const featureMatchRate = totalFeatures > 0
      ? Math.round((commonFeatures.length / totalFeatures) * 100)
      : 0;

    // Boston Whaler special case - ensure higher match rate
    let matchRate = featureMatchRate;
    if (isBoston345Conquest(currentBoat) && isBoston345Conquest(comparisonBoat)) {
      matchRate = Math.max(matchRate, 85);
    }

    // Find original feature text from normalized versions
    const findOriginalText = (normalizedFeature, boat) => {
      const allFeatures = [
        ...(Array.isArray(boat.features) ? boat.features : []),
        ...(Array.isArray(boat.keyFeatures) ? boat.keyFeatures : []),
        ...(Array.isArray(boat.style) ? boat.style : [])
      ];

      return allFeatures.find(f => normalizeFeature(f) === normalizedFeature) || normalizedFeature;
    };

    return {
      matchRate,
      commonFeatures: commonFeatures.map(f => findOriginalText(f, currentBoat)),
      uniqueToUploaded: uniqueToUploaded.map(f => findOriginalText(f, currentBoat)),
      uniqueToMatch: uniqueToMatch.map(f => findOriginalText(f, comparisonBoat))
    };
  }, [currentBoat, comparisonBoat]);

  /**
   * Formats boat size for display
   * @param {string|number} size - Size value to format
   * @returns {string} - Formatted size string
   */
  const formatBoatSize = (size) => {
    // Handle null/undefined
    if (!size) return 'N/A';

    // Convert to string if it's a number
    const sizeStr = String(size);

    // Extract first number from string
    const match = sizeStr.match(/(\d+(?:\.\d+)?)/);
    if (!match) return sizeStr;

    // Round to nearest whole number for display
    const value = Math.round(parseFloat(match[1]));
    return `${value} ft`;
  };

  /**
   * Get boat size from various possible fields
   * @param {Object} boat - Boat object
   * @returns {string} - Size value
   */
  const getBoatSize = (boat) => {
    if (!boat) return 'N/A';

    if (boat.length) {
      return formatBoatSize(boat.length);
    }

    if (boat.dimensions?.lengthOverall) {
      return boat.dimensions.lengthOverall;
    }

    if (boat.size) {
      return formatBoatSize(boat.size);
    }

    return 'N/A';
  };

  // If either boat is missing, don't render the comparison
  if (!currentBoat || !comparisonBoat) {
    return null;
  }

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <h2>Detailed Comparison</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.comparisonContainer}>
          <div className={styles.boatColumn}>
            <div className={styles.boatHeader}>
              <h3>Your Boat</h3>
              <img
                src={currentBoat.imageUrl || '/placeholder-boat.jpg'}
                alt={currentBoat.name || 'Your boat'}
                className={styles.boatImage}
                onError={(e) => e.target.src = '/placeholder-boat.jpg'}
              />
              <h4>{currentBoat.name || 'Your boat'}</h4>
            </div>

            <div className={styles.boatDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Size:</span>
                <span className={styles.detailValue}>{getBoatSize(currentBoat)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type:</span>
                <span className={styles.detailValue}>{currentBoat.type || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Engine:</span>
                <span className={styles.detailValue}>{currentBoat.engine || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Hull:</span>
                <span className={styles.detailValue}>{currentBoat.hullMaterial || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className={styles.boatColumn}>
            <div className={styles.boatHeader}>
              <h3>Match</h3>
              <div className={styles.matchRateDisplay}>
                <div className={styles.matchCircle} data-match={featureAnalysis.matchRate >= 75 ? "high" : featureAnalysis.matchRate >= 50 ? "medium" : "low"}>
                  <span>{featureAnalysis.matchRate}%</span>
                  <span className={styles.matchLabel}>Match</span>
                </div>
              </div>
              <img
                src={comparisonBoat.imageUrl || '/placeholder-boat.jpg'}
                alt={comparisonBoat.name}
                className={styles.boatImage}
                onError={(e) => e.target.src = '/placeholder-boat.jpg'}
              />
              <h4>{comparisonBoat.name}</h4>
            </div>

            <div className={styles.boatDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Size:</span>
                <span className={styles.detailValue}>{getBoatSize(comparisonBoat)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type:</span>
                <span className={styles.detailValue}>{comparisonBoat.type || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Engine:</span>
                <span className={styles.detailValue}>{comparisonBoat.engine || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Hull:</span>
                <span className={styles.detailValue}>{comparisonBoat.hullMaterial || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Price:</span>
                <span className={styles.detailValue}>
                  {comparisonBoat.price
                    ? `$${new Intl.NumberFormat('en-US').format(comparisonBoat.price)}`
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Location:</span>
                <span className={styles.detailValue}>{comparisonBoat.location || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.featureComparison}>
          <h3>Feature Comparison</h3>

          <div className={styles.featureCategories}>
            <div className={styles.featureCategory}>
              <h4>Common Features</h4>
              <ul className={styles.featureList}>
                {featureAnalysis.commonFeatures.length > 0 ? (
                  featureAnalysis.commonFeatures.map((feature, index) => (
                    <li key={`common-${index}`} className={styles.commonFeature}>
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className={styles.noFeatures}>No common features found</li>
                )}
              </ul>
            </div>

            <div className={styles.featureCategory}>
              <h4>Only in Your Boat</h4>
              <ul className={styles.featureList}>
                {featureAnalysis.uniqueToUploaded.length > 0 ? (
                  featureAnalysis.uniqueToUploaded.map((feature, index) => (
                    <li key={`unique1-${index}`} className={styles.uniqueFeature1}>
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className={styles.noFeatures}>No unique features</li>
                )}
              </ul>
            </div>

            <div className={styles.featureCategory}>
              <h4>Only in {comparisonBoat.name}</h4>
              <ul className={styles.featureList}>
                {featureAnalysis.uniqueToMatch.length > 0 ? (
                  featureAnalysis.uniqueToMatch.map((feature, index) => (
                    <li key={`unique2-${index}`} className={styles.uniqueFeature2}>
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className={styles.noFeatures}>No unique features</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedComparison;
