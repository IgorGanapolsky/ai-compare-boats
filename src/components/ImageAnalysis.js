import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyzeBoatImage } from '../services/openaiService';
import BoatAnalysisResults from './BoatAnalysisResults';
import ProgressIndicator from './ProgressIndicator';
import './ImageAnalysis.css';

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [error, setError] = useState(null);
  const progressIntervalRef = useRef(null);

  const simulateProgress = (startProgress, endProgress, duration, stepSize = 2) => {
    let currentProgress = startProgress;
    clearInterval(progressIntervalRef.current);
    
    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < endProgress) {
        currentProgress = Math.min(currentProgress + stepSize, endProgress);
        setAnalysisProgress(currentProgress);
      } else {
        clearInterval(progressIntervalRef.current);
      }
    }, duration / ((endProgress - startProgress) / stepSize));
  };

  const handleProgressUpdate = (progress, message) => {
    clearInterval(progressIntervalRef.current);
    setAnalysisMessage(message);

    switch (progress) {
      case 20:
        setAnalysisProgress(20);
        setAnalysisMessage('Initializing image analysis...');
        simulateProgress(20, 35, 5000);
        break;
      case 35:
        setAnalysisProgress(35);
        setAnalysisMessage('Processing image features...');
        simulateProgress(35, 45, 2000);
        break;
      case 50:
        setAnalysisProgress(50);
        setAnalysisMessage('Identifying boat characteristics...');
        simulateProgress(50, 70, 8000);
        break;
      case 75:
        setAnalysisProgress(75);
        setAnalysisMessage('Finalizing analysis...');
        simulateProgress(75, 85, 2000);
        break;
      case 85:
        setAnalysisProgress(85);
        setAnalysisMessage('Almost done...');
        simulateProgress(85, 95, 2000);
        break;
      case 95:
        setAnalysisProgress(95);
        setAnalysisMessage('Completing analysis...');
        simulateProgress(95, 98, 1000);
        break;
      default:
        setAnalysisProgress(progress);
    }
  };

  const completeAnalysis = (results) => {
    return new Promise(resolve => {
      clearInterval(progressIntervalRef.current);
      setAnalysisProgress(98);
      setAnalysisMessage('Completing analysis...');
      let currentProgress = 98;
      
      progressIntervalRef.current = setInterval(() => {
        if (currentProgress < 100) {
          currentProgress = Math.min(currentProgress + 0.5, 100);
          setAnalysisProgress(currentProgress);
          
          if (currentProgress === 100) {
            clearInterval(progressIntervalRef.current);
            setAnalysisResults(results);
            resolve();
          }
        }
      }, 50);
    });
  };

  const handleImageAnalysis = async (file) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResults(null);
      setError(null);
      
      // Create image preview
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      
      setAnalysisProgress(0);
      setAnalysisMessage('Preparing image...');
      simulateProgress(0, 10, 1000);
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64Promise;
      const results = await analyzeBoatImage(base64Image, handleProgressUpdate);
      
      clearInterval(progressIntervalRef.current);
      await completeAnalysis(results);
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisMessage('');
      }, 500);
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedImage(file);
      handleImageAnalysis(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <div className="image-analysis">
      {!isAnalyzing && !analysisResults && (
        <>
          <h1>Find Similar Boats</h1>
          <p className="description">
            Upload a boat image and our AI will analyze it to find similar boats based on appearance,
            specifications, and features
          </p>
        </>
      )}
      
      <div className={isAnalyzing ? "analysis-container" : analysisResults ? "results-container" : "upload-container"}>
        {isAnalyzing ? (
          <div className="analyzing-content">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Uploaded boat" />
              </div>
            )}
            <ProgressIndicator progress={analysisProgress} message={analysisMessage} />
          </div>
        ) : analysisResults ? (
          <BoatAnalysisResults results={analysisResults} onReset={handleReset} />
        ) : (
          <div {...getRootProps()} className="upload-zone">
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
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleReset}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysis;
