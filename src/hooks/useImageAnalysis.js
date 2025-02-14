import { useState } from 'react';
import { useQuery } from 'react-query';
import { findSimilarBoats } from '../services/boatService';

export function useImageAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const { data: similarBoats = [], isLoading } = useQuery(
    ['similarBoats', analysis],
    () => findSimilarBoats(analysis),
    {
      enabled: !!analysis,
      staleTime: Infinity,
      cacheTime: Infinity,
      onError: (err) => {
        console.error('Error finding similar boats:', err);
        setError(err);
      }
    }
  );

  const handleAnalysisComplete = async (newAnalysis) => {
    try {
      setError(null);
      setAnalysis(newAnalysis);
    } catch (err) {
      console.error('Error handling analysis:', err);
      setError(err);
    }
  };

  return {
    similarBoats,
    isLoading: isLoading && !!analysis,
    error,
    handleAnalysisComplete
  };
}
