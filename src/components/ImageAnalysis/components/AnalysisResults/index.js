import React from 'react';
import styles from './styles.module.css';

const AnalysisResults = ({ results, imagePreview, onReset }) => {
  const {
    detectedType,
    engineType,
    estimatedSize,
    keyFeatures = [],
    styleTags = [],
    styleDetails = []
  } = results;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.imageSection}>
          <img src={imagePreview} alt="Analyzed boat" className={styles.image} />
          <button onClick={onReset} className={styles.resetButton}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 8C13.3333 10.9467 10.9467 13.3333 8 13.3333C5.05333 13.3333 2.66667 10.9467 2.66667 8C2.66667 5.05333 5.05333 2.66667 8 2.66667M8 2.66667L10.6667 5.33333M8 2.66667L5.33333 5.33333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Search
          </button>
        </div>

        <div className={styles.details}>
          <h2 className={styles.title}>Analysis Results</h2>
          
          <div className={styles.mainInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Detected Type</span>
              <span className={styles.value}>{detectedType}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Engine Type</span>
              <span className={styles.value}>{engineType}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Estimated Size</span>
              <span className={styles.value}>{estimatedSize}</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Key Features</h3>
            <div className={styles.tags}>
              {keyFeatures.map((feature, index) => (
                <span key={index} className={styles.tag}>{feature}</span>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Style Tags</h3>
            <div className={styles.tags}>
              {styleTags.map((tag, index) => (
                <span key={index} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className={styles.styleAnalysis}>
            <h3 className={styles.sectionTitle}>Style Analysis</h3>
            {styleDetails.map((detail, index) => (
              <div key={index} className={styles.styleDetail}>
                {detail.category !== 'Overview' && (
                  <h4 className={styles.styleCategory}>{detail.category}</h4>
                )}
                <p className={styles.styleContent}>{detail.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
