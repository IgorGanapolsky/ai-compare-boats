// Boat matching utilities

// Extract boat length from various possible fields
const getBoatLength = (boat) => {
  if (!boat) return 0;
  
  // Direct length field
  if (boat.length) return parseFloat(boat.length);
  
  // Length from dimensions
  if (boat.dimensions?.lengthOverall) {
    const match = boat.dimensions.lengthOverall.match(/(\d+)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  // Size field as string
  if (typeof boat.size === 'string') {
    const match = boat.size.match(/(\d+)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  // Size field as number
  return parseFloat(boat.size) || 0;
};

// Normalize boat data for comparison
const normalizeBoatData = (boat) => {
  if (!boat) return {};
  return {
    type: boat.type || '',
    length: getBoatLength(boat),
    features: Array.isArray(boat.features) ? boat.features : [boat.features].filter(Boolean)
  };
};

// Type match score calculation
const getTypeMatchScore = (type1, type2) => {
  if (!type1 || !type2) return 0;
  
  // Normalize types by converting to lowercase and removing extra spaces
  const normalizedType1 = type1.toLowerCase().trim();
  const normalizedType2 = type2.toLowerCase().trim();

  // Direct match
  if (normalizedType1 === normalizedType2) return 1;

  // Handle special cases
  const typeMap = {
    'cabin boat': ['center console cabin boat', 'express cruiser'],
    'center console': ['center console cabin boat'],
    'sport fishing': ['sport fishing express', 'center console'],
    'express cruiser': ['cabin boat', 'sport fishing express']
  };

  // Check if types are related
  if (typeMap[normalizedType1]?.includes(normalizedType2) || 
      typeMap[normalizedType2]?.includes(normalizedType1)) {
    return 0.8;
  }

  // Check if one type contains the other
  if (normalizedType1.includes(normalizedType2) || 
      normalizedType2.includes(normalizedType1)) {
    return 0.7;
  }

  // Calculate word overlap
  const words1 = normalizedType1.split(' ');
  const words2 = normalizedType2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length > 0) {
    return 0.5 * (commonWords.length / Math.max(words1.length, words2.length));
  }

  return 0;
};

export const calculateMatchScore = (currentBoat, comparisonBoat) => {
  // Normalize boat data
  const current = normalizeBoatData(currentBoat);
  const comparison = normalizeBoatData(comparisonBoat);

  // Type match (45% weight)
  const typeMatch = getTypeMatchScore(current.type, comparison.type);

  // Length match (25% weight)
  const lengthMatch = () => {
    if (!current.length || !comparison.length) return 0;

    const lengthDiff = Math.abs(current.length - comparison.length);
    const largerLength = Math.max(current.length, comparison.length);
    const diffPercentage = lengthDiff / largerLength;

    // More forgiving length matching
    if (diffPercentage <= 0.1) return 1;      // Within 10%
    if (diffPercentage <= 0.2) return 0.8;    // Within 20%
    if (diffPercentage <= 0.3) return 0.6;    // Within 30%
    if (diffPercentage <= 0.4) return 0.4;    // Within 40%
    
    return 0.2;  // Different lengths but still same category
  };

  // Feature match (30% weight)
  const featureMatch = () => {
    if (!current.features?.length || !comparison.features?.length) return 0;

    const normalizeFeatures = (features) => {
      return features.flatMap(feature => {
        if (typeof feature !== 'string') return [];
        return feature.toLowerCase()
          .replace(/[.,]/g, '')
          .split(/\s+/)
          .filter(word => !['and', 'with', 'the', 'a', 'an', 'for', 'to', 'in', 'on', 'at'].includes(word));
      });
    };

    const featureCategories = {
      navigation: ['navigation', 'gps', 'radar', 'electronics', 'helm'],
      comfort: ['seating', 'cabin', 'console', 'comfort', 'protection'],
      safety: ['safety', 'rails', 'handrails', 'protection'],
      fishing: ['fishing', 'rod', 'holders', 'livewell', 'tackle'],
      hull: ['hull', 'deck', 'stepped', 'deep-v', 'fiberglass']
    };

    const categorizeFeature = (word) => {
      for (const [category, keywords] of Object.entries(featureCategories)) {
        if (keywords.some(keyword => word.includes(keyword))) {
          return category;
        }
      }
      return null;
    };

    const currentFeatures = normalizeFeatures(current.features);
    const comparisonFeatures = normalizeFeatures(comparison.features);

    // Group features by category
    const currentCategories = new Set(currentFeatures.map(categorizeFeature).filter(Boolean));
    const comparisonCategories = new Set(comparisonFeatures.map(categorizeFeature).filter(Boolean));

    // Calculate category overlap
    const commonCategories = [...currentCategories].filter(cat => comparisonCategories.has(cat));
    const categoryScore = commonCategories.length / Math.max(currentCategories.size, comparisonCategories.size) || 0;

    // Calculate word-level similarity
    const commonWords = currentFeatures.filter(word => comparisonFeatures.includes(word));
    const wordScore = commonWords.length / Math.max(currentFeatures.length, comparisonFeatures.length) || 0;

    return (categoryScore * 0.6) + (wordScore * 0.4);
  };

  const weights = {
    type: 0.45,
    length: 0.25,
    features: 0.3
  };

  const score = (typeMatch * weights.type) + 
         (lengthMatch() * weights.length) + 
         (featureMatch() * weights.features);
         
  return Math.round(score * 100);
};