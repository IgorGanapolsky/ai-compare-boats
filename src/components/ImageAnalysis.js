import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { modelService } from '../services/modelService';
import { analyzeBoatImage } from '../services/openaiService';
import { imageService } from '../services/imageService';
import { cacheService } from '../services/cacheService';
import BoatAnalysisResults from './BoatAnalysisResults';
import './ImageAnalysis.css';

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModelReady, setIsModelReady] = useState(false);

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
    // Cleanup image URLs when component unmounts
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        imageService.revokeImageUrl(selectedImage);
      }
    };
  }, [selectedImage]);

  const analyzeImage = async (file) => {
    try {
      setError(null);
      setIsAnalyzing(true);

      const imageUrl = await imageService.uploadImage(file);
      const base64Image = await imageService.preprocessImage(file);

      // Try online analysis first if we're online
      if (isOnline) {
        try {
          const results = await analyzeBoatImage(base64Image);
          // Cache results for offline use if offline analysis is ready
          if (isModelReady) {
            const imageElement = await modelService.loadImage(imageUrl);
            const visualFeatures = await modelService.extractVisualFeatures(imageElement);

            await cacheService.cacheBoat({
              id: Date.now().toString(),
              ...results,
              imageUrl,
              visualFeatures
            });
          }
          setAnalysisResults(results);
          return;
        } catch (err) {
          console.error('Online analysis failed:', err);
          if (!isModelReady) {
            throw new Error('Online analysis failed and offline analysis is not available');
          }
        }
      }

      // Fallback to offline analysis
      if (!isModelReady) {
        throw new Error('Offline analysis not available. Please connect to the internet.');
      }

      const offlineResults = await modelService.analyzeImageOffline(imageUrl);
      setAnalysisResults(offlineResults);
    } catch (err) {
      setError(err.message);
      console.error('Error analyzing image:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    await analyzeImage(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  return (
    <div className="image-analysis-container">
      {!isOnline && (
        <div className="offline-notice">
          Offline Mode: Basic visual analysis only. Connect to internet for detailed analysis.
        </div>
      )}

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Selected boat"
            className="preview-image"
          />
        ) : (
          <p>Drag & drop a boat image here, or click to select one</p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <BoatAnalysisResults
        analysisResults={analysisResults}
        isLoading={isAnalyzing}
        error={error}
        isOfflineMode={!isOnline}
      />
    </div>
  );
};

export default ImageAnalysis;
