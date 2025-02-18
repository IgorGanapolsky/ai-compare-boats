import React from 'react';
import styles from './styles.module.css';
import { calculateMatchScore } from '../../utils/boatMatching';

const DetailedComparison = ({ currentBoat, comparisonBoat, onClose }) => {
  const getLengthAnalysis = () => {
    const currentLength = parseFloat(currentBoat.length || currentBoat.size || '0');
    const comparisonLength = parseFloat(comparisonBoat.length || '0');
    const difference = Math.abs(comparisonLength - currentLength);
    
    const matchPercentage = difference <= 5 
      ? Math.round(100 - (difference * 8))
      : difference <= 10 
        ? Math.round(60 - ((difference - 5) * 6))
        : Math.max(0, Math.round(30 - ((difference - 10) * 3)));

    return {
      length: comparisonLength,
      difference: difference.toFixed(1),
      matchPercentage
    };
  };

  const getFeatureAnalysis = () => {
    // Normalize feature text for better matching
    const normalizeFeature = (feature) => feature.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/for|with|and|the|a|an/g, '') // Remove common words
      .trim();

    // Extract features from OpenAI analysis text if available
    const extractFeaturesFromAnalysis = (boat) => {
      const features = new Set();
      
      // Add explicit features
      if (Array.isArray(boat.features)) {
        boat.features.forEach(f => features.add(normalizeFeature(f)));
      }

      // Add features from keyFeatures if available (from OpenAI analysis)
      if (Array.isArray(boat.keyFeatures)) {
        boat.keyFeatures.forEach(f => features.add(normalizeFeature(f)));
      }

      // Add style features if available
      if (Array.isArray(boat.style)) {
        boat.style.forEach(s => features.add(normalizeFeature(s)));
      }

      return features;
    };

    const currentFeatures = extractFeaturesFromAnalysis(currentBoat);
    const comparisonFeatures = extractFeaturesFromAnalysis(comparisonBoat);

    // Improved feature matching logic
    const findSimilarFeatures = (feature, targetSet) => {
      return [...targetSet].some(target => {
        // Direct match
        if (feature === target) return true;

        // Substring match
        if (feature.includes(target) || target.includes(feature)) return true;

        // Word similarity match
        const featureWords = feature.split(' ');
        const targetWords = target.split(' ');
        
        // Count matching words
        const commonWords = featureWords.filter(word => 
          targetWords.some(targetWord => 
            targetWord.includes(word) || word.includes(targetWord)
          )
        );

        // Calculate similarity score
        const similarityScore = commonWords.length / Math.max(featureWords.length, targetWords.length);
        return similarityScore >= 0.5;
      });
    };

    const commonFeatures = [...currentFeatures].filter(f => 
      findSimilarFeatures(f, comparisonFeatures)
    );
    const uniqueToUploaded = [...currentFeatures].filter(f => 
      !findSimilarFeatures(f, comparisonFeatures)
    );
    const uniqueToMatch = [...comparisonFeatures].filter(f => 
      !findSimilarFeatures(f, currentFeatures)
    );

    const totalUniqueFeatures = uniqueToUploaded.length + uniqueToMatch.length;
    const matchRate = Math.round(
      (commonFeatures.length / (commonFeatures.length + totalUniqueFeatures)) * 100
    );

    const findOriginalText = (normalizedFeature, featureList) => 
      featureList.find(f => normalizeFeature(f) === normalizedFeature) || normalizedFeature;

    return {
      matchRate,
      commonFeatures: commonFeatures.map(f => findOriginalText(f, currentBoat.features || [])),
      uniqueToUploaded: uniqueToUploaded.map(f => findOriginalText(f, currentBoat.features || [])),
      uniqueToMatch: uniqueToMatch.map(f => findOriginalText(f, comparisonBoat.features || []))
    };
  };

  const getMatchLevel = (percentage) => {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  };

  const lengthAnalysis = getLengthAnalysis();
  const featureAnalysis = getFeatureAnalysis();
  const overallMatchScore = calculateMatchScore(currentBoat, comparisonBoat);

  const renderSpecification = (label, value, matchPercentage) => {
    const matchLevel = getMatchLevel(matchPercentage);
    return (
      <div className={styles.specRow}>
        <span className={styles.specLabel}>{label}</span>
        <div className={styles.specValue}>
          {value}
          <span className={`${styles.matchIndicator} ${styles[matchLevel]}`}>
            {matchLevel === 'high' ? '✓' : '×'}
          </span>
        </div>
      </div>
    );
  };

  const renderFeatureTag = (feature, type) => (
    <span className={`${styles.featureTag} ${styles[type]}`}>
      {feature}
    </span>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Detailed Comparison</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.boatImages}>
            <div className={styles.boatSection}>
              <h3>Your Reference Boat</h3>
              <img src={currentBoat.imageUrl} alt="Reference boat" />
            </div>
            <div className={styles.boatSection}>
              <h3>{comparisonBoat.name}</h3>
              <div className={styles.matchScoreBadge}>
                {overallMatchScore}% Overall Match
              </div>
              <img src={comparisonBoat.imageUrl} alt={comparisonBoat.name} />
            </div>
          </div>

          <section className={styles.specifications}>
            <h3>Key Specifications Comparison</h3>
            <div className={styles.specGrid}>
              {renderSpecification(
                'Length',
                `${lengthAnalysis.length} ft (+${lengthAnalysis.difference} ft, ${lengthAnalysis.matchPercentage}% match)`,
                lengthAnalysis.matchPercentage
              )}
              {renderSpecification(
                'Hull Material',
                comparisonBoat.hullMaterial,
                currentBoat.hullMaterial?.toLowerCase() === comparisonBoat.hullMaterial?.toLowerCase() ? 100 : 0
              )}
              {renderSpecification(
                'Engine',
                comparisonBoat.engine,
                currentBoat.engine === comparisonBoat.engine ? 100 : 0
              )}
              {renderSpecification(
                'Boat Category',
                comparisonBoat.type,
                currentBoat.type?.toLowerCase() === comparisonBoat.type?.toLowerCase() ? 100 : 0
              )}
            </div>
          </section>

          <section className={styles.featureAnalysis}>
            <h3>Feature Analysis</h3>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{featureAnalysis.matchRate}%</span>
                <span className={styles.metricLabel}>Feature Match Rate</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{featureAnalysis.commonFeatures.length}</span>
                <span className={styles.metricLabel}>Common Features</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {featureAnalysis.uniqueToUploaded.length + featureAnalysis.uniqueToMatch.length}
                </span>
                <span className={styles.metricLabel}>Unique Features</span>
              </div>
            </div>

            <div className={styles.featureTags}>
              <h4>Common Features:</h4>
              <div className={styles.tagGroup}>
                {featureAnalysis.commonFeatures.map(feature => 
                  renderFeatureTag(feature, 'common')
                )}
              </div>
            </div>

            <div className={styles.uniqueFeatures}>
              <div className={styles.uniqueSection}>
                <h4>Unique to Uploaded Boat</h4>
                <div className={styles.tagGroup}>
                  {featureAnalysis.uniqueToUploaded.map(feature => 
                    renderFeatureTag(feature, 'uniqueUploaded')
                  )}
                </div>
              </div>
              <div className={styles.uniqueSection}>
                <h4>Unique to Match Boat</h4>
                <div className={styles.tagGroup}>
                  {featureAnalysis.uniqueToMatch.map(feature => 
                    renderFeatureTag(feature, 'uniqueMatch')
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DetailedComparison;
