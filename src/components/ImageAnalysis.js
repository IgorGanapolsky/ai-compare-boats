import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { modelService } from '../services/modelService';
import { analyzeBoatImage } from '../services/openaiService';
import { imageService } from '../services/imageService';
import ProgressIndicator from './ProgressIndicator';
import BoatAnalysisResults from './BoatAnalysisResults';
import './ImageAnalysis.css';

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModelReady, setIsModelReady] = useState(false);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Initialize offline capabilities
    const init = async () => {
      try {
        await modelService.initialize();
        setIsModelReady(true);
      } catch (err) {
        console.error('Failed to initialize offline analysis:', err);
      }
    };
    init();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

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
        setAnalysisMessage('Analyzing boat characteristics...');
        simulateProgress(50, 70, 8000);
        break;
      case 75:
        setAnalysisProgress(75);
        setAnalysisMessage('Identifying boat details...');
        simulateProgress(75, 85, 2000);
        break;
      case 85:
        setAnalysisProgress(85);
        setAnalysisMessage('Finalizing analysis...');
        simulateProgress(85, 95, 2000);
        break;
      case 95:
        setAnalysisProgress(95);
        setAnalysisMessage('Almost done...');
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

  const analyzeImage = async (file) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResults(null);
      setError(null);
      
      setAnalysisProgress(0);
      setAnalysisMessage('Preparing image...');
      simulateProgress(0, 10, 1000);
      
      const base64Image = await imageService.fileToBase64(file);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        await analyzeImage(file);
      }
    }
  });

  const handleNewSearch = () => {
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    setAnalysisResults(null);
    setAnalysisProgress(0);
    setAnalysisMessage('');
    setIsAnalyzing(false);
    setError(null);
  };

  return (
    <div className="image-analysis-container">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {selectedImage ? (
          <img src={selectedImage} alt="Selected boat" className="preview-image" />
        ) : (
          <p>Drag & drop a boat image here, or click to select one</p>
        )}
      </div>

      {isAnalyzing && (
        <ProgressIndicator 
          progress={analysisProgress} 
          message={analysisMessage}
        />
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <BoatAnalysisResults 
        analysisResults={analysisResults}
        isLoading={isAnalyzing}
        onNewSearch={handleNewSearch}
      />
    </div>
  );
};

export default ImageAnalysis;
