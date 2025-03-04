/**
 * Feature: SimilarBoats
 * 
 * This feature module provides functionality for finding and displaying
 * boats that are similar to a selected boat.
 */

// Re-export public API for this feature
import { calculateMatchScore, MATCH_WEIGHTS, ERROR_TYPES } from './utils/boatMatching';

// Re-export components - these will be created later as we refactor
// import SimilarBoats from './components/SimilarBoats';
// import SimilarBoatsList from './components/SimilarBoatsList';
// import MatchRating from './components/MatchRating';

export {
  calculateMatchScore,
  MATCH_WEIGHTS,
  ERROR_TYPES,
  // SimilarBoats,
  // SimilarBoatsList,
  // MatchRating
};
