import { useState, useEffect } from 'react';
import sampleBoats from '../data/sampleBoats';

/**
 * Custom hook to fetch and manage all boats data
 * @returns {Object} Object containing allBoats array and loading status
 */
export const useAllBoats = () => {
  const [allBoats, setAllBoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoats = async () => {
      try {
        // In a real app, this would be an API call
        // For this demo, we're using sample data to simulate an API
        // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        // Set the sample boats as our data
        setAllBoats(sampleBoats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching boats:', err);
        setError(err.message || 'Failed to load boats');
        setLoading(false);
        
        // Fallback to sample data in case of error
        setAllBoats(sampleBoats);
      }
    };

    fetchBoats();
  }, []);

  return {
    allBoats,
    loading,
    error,
    // Could add more functions here like addBoat, updateBoat, etc.
  };
};
