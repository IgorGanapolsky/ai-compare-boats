import { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { getAllBoats, compareBoats as compareBoatsService } from '../services/boatDatabaseService';

export function useBoatComparison() {
  const [selectedBoats, setSelectedBoats] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);

  const { data: boats, isLoading, error } = useQuery('boats', getAllBoats, {
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const compareBoats = useCallback((boat1Id, boat2Id) => {
    if (!boats) return;
    
    const comparison = compareBoatsService(boat1Id, boat2Id);
    if (comparison) {
      setSelectedBoats([comparison.boat1, comparison.boat2]);
      setComparisonResults(comparison);
    }
  }, [boats]);

  const selectBoat = useCallback((boatId) => {
    if (!boats) return;

    const boat = boats.find(b => b.id === boatId);
    if (!boat) return;

    setSelectedBoats(prev => {
      if (prev.some(b => b.id === boatId)) {
        return prev.filter(b => b.id !== boatId);
      }
      if (prev.length < 2) {
        return [...prev, boat];
      }
      return [prev[1], boat];
    });
  }, [boats]);

  const clearSelection = useCallback(() => {
    setSelectedBoats([]);
    setComparisonResults(null);
  }, []);

  return {
    boats,
    selectedBoats,
    comparisonResults,
    isLoading,
    error,
    compareBoats,
    selectBoat,
    clearSelection
  };
}
