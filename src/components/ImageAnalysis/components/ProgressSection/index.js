import React from 'react';
import styles from './styles.module.css';

const ProgressSection = ({
  imagePreview,
  isAnalyzing,
  progress,
  analysisMessage,
  error,
  onReset
}) => {
  return (
    <div className={styles.container}>
      <img
        src={imagePreview}
        alt="Boat preview"
        className={styles.preview}
      />
      
      {isAnalyzing && (
        <div className={styles.progress}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Analyzing image...</span>
            <span className={styles.progressValue}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressMessage}>{analysisMessage}</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={onReset} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressSection;
