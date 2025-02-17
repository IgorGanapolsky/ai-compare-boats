import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './styles.module.css';
import { analyzeBoatImage } from '../../services/openaiService';

const ImageAnalysis = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setResults(null);
    setProgress(0);
    setIsAnalyzing(true);

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    try {
      const result = await analyzeBoatImage(file, (currentProgress, message) => {
        setProgress(currentProgress);
        setAnalysisMessage(message);
      });
      setResults(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const resetAnalysis = () => {
    setImagePreview(null);
    setResults(null);
    setError(null);
    setProgress(0);
    setAnalysisMessage('');
    setIsAnalyzing(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find Similar Boats</h1>
        <p className={styles.description}>
          Upload a boat image and our AI will analyze its
          characteristics to find similar boats
        </p>
      </header>

      <div className={styles.content}>
        {!imagePreview ? (
          <div {...getRootProps()} className={styles.dropzone}>
            <input {...getInputProps()} />
            <div className={styles.uploadContent}>
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none">
                <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18M7 10C4.79086 10 3 11.7909 3 14C3 16.2091 4.79086 18 7 18M7 10C8.01445 10 8.94069 10.3776 9.64582 11M12 21V13M12 13L15 16M12 13L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <>
                  <p>Drag and drop a boat image here</p>
                  <p className={styles.uploadHint}>or click to select from your computer</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.analysisContainer}>
            <div className={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="Boat preview" className={styles.previewImage} />
              {isAnalyzing && (
                <div className={styles.progressOverlay}>
                  <div className={styles.progressContent}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={styles.progressInfo}>
                      <span className={styles.progressPercentage}>{progress}%</span>
                      <span className={styles.progressMessage}>{analysisMessage}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {results && !isAnalyzing && (
              <div className={styles.resultsContainer}>
                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Detected Type</h3>
                  <p className={styles.resultValue}>{results.detectedType}</p>
                </div>

                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Estimated Size</h3>
                  <p className={styles.resultValue}>{results.estimatedSize}</p>
                </div>

                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Engine Type</h3>
                  <p className={styles.resultValue}>{results.engineType}</p>
                </div>

                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Key Features</h3>
                  <div className={styles.featuresList}>
                    {results.keyFeatures.map((feature, index) => (
                      <span key={index} className={styles.feature}>{feature}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Style Analysis</h3>
                  {results.styleDetails.map((detail, index) => (
                    <div key={index} className={styles.styleDetail}>
                      {detail.category !== 'Overview' && (
                        <h4 className={styles.styleCategory}>{detail.category}</h4>
                      )}
                      <p className={styles.styleContent}>{detail.content}</p>
                    </div>
                  ))}
                </div>

                <button onClick={resetAnalysis} className={styles.newSearchButton}>
                  New Search
                </button>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <p className={styles.errorMessage}>{error}</p>
                <button onClick={resetAnalysis} className={styles.retryButton}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
