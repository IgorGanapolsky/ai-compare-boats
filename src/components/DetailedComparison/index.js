import React from 'react';
import styles from './styles.module.css';

const DetailedComparison = ({ currentBoat, comparisonBoat, onClose }) => {
  const getFeatureAnalysis = () => {
    const normalizeFeature = (feature) => feature.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/for|with|and|the|a|an/g, '')
      .trim();

    const extractFeaturesFromAnalysis = (boat) => {
      const features = new Set();
      
      if (Array.isArray(boat.features)) {
        boat.features.forEach(f => features.add(normalizeFeature(f)));
      }

      if (Array.isArray(boat.keyFeatures)) {
        boat.keyFeatures.forEach(f => features.add(normalizeFeature(f)));
      }

      if (Array.isArray(boat.style)) {
        boat.style.forEach(s => features.add(normalizeFeature(s)));
      }

      return features;
    };

    const currentFeatures = extractFeaturesFromAnalysis(currentBoat);
    const comparisonFeatures = extractFeaturesFromAnalysis(comparisonBoat);

    const findSimilarFeatures = (feature, targetSet) => {
      return [...targetSet].some(target => {
        if (feature === target) return true;
        if (feature.includes(target) || target.includes(feature)) return true;

        const featureWords = feature.split(' ');
        const targetWords = target.split(' ');
        
        const commonWords = featureWords.filter(word => 
          targetWords.some(targetWord => 
            targetWord.includes(word) || word.includes(targetWord)
          )
        );

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

  const featureAnalysis = getFeatureAnalysis();

  const formatBoatSize = (size) => {
    // Handle null/undefined
    if (!size) return 'N/A';
    
    // Convert to string if it's a number
    const sizeStr = String(size);
    
    // Extract first number from string
    const match = sizeStr.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 'N/A';
    
    // Round to nearest whole number
    const value = Math.round(parseFloat(match[1]));
    return `${value} ft`;
  };

  const renderSpecification = (label, value1, value2) => {
    let match = false;
    if (label === 'Length') {
      const size1 = formatBoatSize(value1);
      const size2 = formatBoatSize(value2);
      value1 = size1;
      value2 = size2;
      // Compare numeric values only
      const num1 = parseFloat(size1);
      const num2 = parseFloat(size2);
      match = !isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) <= 2;
    } else if (label === 'Boat Category') {
      match = value1?.toLowerCase()?.trim() === value2?.toLowerCase()?.trim();
    } else {
      match = value1 === value2;
    }

    return (
      <div className={styles.specification}>
        <div className={styles.specLabel}>{label}</div>
        <div className={styles.specValue}>
          <div>{value1 || 'N/A'}</div>
          {match ? (
            <div className={styles.matchIcon}>✓</div>
          ) : (
            <div className={styles.noMatchIcon}>×</div>
          )}
        </div>
        <div className={styles.specValue}>
          <div>{value2 || 'N/A'}</div>
          {match ? (
            <div className={styles.matchIcon}>✓</div>
          ) : (
            <div className={styles.noMatchIcon}>×</div>
          )}
        </div>
      </div>
    );
  };

  const renderFeatureTag = (feature, type) => (
    <span key={feature} className={`${styles.featureTag} ${styles[type]}`}>
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
              {currentBoat.imageUrl && (
                <img src={currentBoat.imageUrl} alt="Reference boat" />
              )}
            </div>
            <div className={styles.boatSection}>
              <h3>{comparisonBoat.name}</h3>
              <img src={comparisonBoat.imageUrl} alt={comparisonBoat.name} />
            </div>
          </div>

          <section className={styles.specifications}>
            <h3>Key Specifications Comparison</h3>
            <div className={styles.specGrid}>
              {renderSpecification(
                'Length',
                currentBoat.length || currentBoat.size,
                comparisonBoat.length
              )}
              {renderSpecification(
                'Hull Material',
                currentBoat.hullMaterial,
                comparisonBoat.hullMaterial
              )}
              {renderSpecification(
                'Engine',
                currentBoat.engine,
                comparisonBoat.engine
              )}
              {renderSpecification(
                'Boat Category',
                currentBoat.type,
                comparisonBoat.type
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
