import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyzeBoatImage } from '../services/openaiService';
import BoatAnalysisResults from './BoatAnalysisResults';
import './ImageAnalysis.css';

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const simulateProgress = (startProgress, endProgress, duration, stepSize = 2) => {
    let currentProgress = startProgress;
    const intervalId = setInterval(() => {
      if (currentProgress < endProgress) {
        currentProgress = Math.min(currentProgress + stepSize, endProgress);
        setAnalysisProgress(currentProgress);
      } else {
        clearInterval(intervalId);
      }
    }, duration / ((endProgress - startProgress) / stepSize));
    return intervalId;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP file');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setAnalysisMessage('Starting analysis...');
    setAnalysisProgress(0);

    try {
      // Initial progress simulation
      const initialProgressId = simulateProgress(0, 30, 1000);

      // Simulate processing stages
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(initialProgressId);
      setAnalysisMessage('Analyzing boat features...');
      
      const midProgressId = simulateProgress(30, 60, 1500);
      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(midProgressId);
      
      setAnalysisMessage('Identifying characteristics...');
      const lateProgressId = simulateProgress(60, 85, 1500);
      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(lateProgressId);

      // Call the API
      const results = await analyzeBoatImage(file, (progress, message) => {
        setAnalysisProgress(progress);
        if (message) setAnalysisMessage(message);
      });
      
      // Final progress
      setAnalysisMessage('Completing analysis...');
      const finalProgressId = simulateProgress(85, 100, 1000);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(finalProgressId);
      
      setAnalysisResults(results);
      setIsAnalyzing(false);

    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false
  });

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResults(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisMessage('');
    setError(null);
  };

  return (
    <div className="image-analysis">
      <h1>Find Similar Boats</h1>
      <p className="description">
        Upload a boat image and our AI will analyze its characteristics to find similar boats
      </p>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className={isAnalyzing ? "analysis-container" : analysisResults ? "results-container" : "upload-container"}>
        {!isAnalyzing && !analysisResults && (
          <div {...getRootProps({ className: 'upload-zone' })}>
            <input {...getInputProps()} />
            <div className="upload-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="upload-text">
                Drag and drop your boat image here or
              </div>
              <button className="browse-button">Browse Files</button>
              <div className="supported-formats">
                Supported formats: JPG, PNG, WEBP (max 10MB)
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-content">
            <div className="image-preview">
              <img src={imagePreview} alt="Boat preview" />
            </div>
            <div className="progress-container">
              <div className="progress-header">
                <div className="progress-title">Analyzing Image</div>
                <div className="progress-percentage">{Math.round(analysisProgress)}%</div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="analysis-status">{analysisMessage}</div>
            </div>
          </div>
        )}

        {analysisResults && (
          <BoatAnalysisResults 
            results={analysisResults} 
            imagePreview={imagePreview}
            onReset={handleReset} 
          />
        )}
      </div>
    </div>
  );
};

export default ImageAnalysis;
