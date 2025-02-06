import { calculateFeatureSimilarity } from '../utils/similarityUtils';

class BoatComparisonService {
  constructor() {
    this.comparisonCache = new Map();
  }

  /**
   * Generate a unique cache key for two boat IDs
   */
  getCacheKey(boat1Id, boat2Id) {
    return [boat1Id, boat2Id].sort().join('-');
  }

  /**
   * Compare two boats and return similarity metrics
   */
  async compareBoats(boat1, boat2) {
    const cacheKey = this.getCacheKey(boat1.id, boat2.id);
    
    // Check cache first
    if (this.comparisonCache.has(cacheKey)) {
      return this.comparisonCache.get(cacheKey);
    }

    // Calculate similarities for different aspects
    const lengthSimilarity = this.calculateLengthSimilarity(boat1.length, boat2.length);
    const typeSimilarity = this.calculateTypeSimilarity(boat1.type, boat2.type);
    const featureSimilarity = calculateFeatureSimilarity(boat1.features, boat2.features);
    
    // Calculate overall similarity score (weighted average)
    const overallScore = Math.round(
      (lengthSimilarity * 0.3) + 
      (typeSimilarity * 0.4) + 
      (featureSimilarity * 0.3)
    );

    // Generate comparison details
    const comparison = {
      overallScore,
      details: {
        length: {
          score: lengthSimilarity,
          difference: Math.abs(boat1.length - boat2.length),
          unit: 'ft'
        },
        type: {
          score: typeSimilarity,
          match: boat1.type === boat2.type,
          types: [boat1.type, boat2.type]
        },
        features: {
          score: featureSimilarity,
          common: this.findCommonFeatures(boat1.features, boat2.features),
          unique1: this.findUniqueFeatures(boat1.features, boat2.features),
          unique2: this.findUniqueFeatures(boat2.features, boat1.features)
        },
        specifications: this.compareSpecifications(boat1, boat2)
      }
    };

    // Cache the results
    this.comparisonCache.set(cacheKey, comparison);
    
    return comparison;
  }

  /**
   * Calculate similarity score based on boat lengths
   */
  calculateLengthSimilarity(length1, length2) {
    const difference = Math.abs(length1 - length2);
    if (difference === 0) return 100;
    if (difference <= 2) return 90;
    if (difference <= 5) return 80;
    if (difference <= 8) return 60;
    if (difference <= 10) return 40;
    return 20;
  }

  /**
   * Calculate similarity score based on boat types
   */
  calculateTypeSimilarity(type1, type2) {
    // Exact match
    if (type1 === type2) return 100;

    // Define type categories for partial matches
    const categories = {
      sailing: ['sailboat', 'sailing yacht', 'sail'],
      motor: ['motor yacht', 'powerboat', 'cruiser'],
      luxury: ['yacht', 'cruiser', 'motor yacht'],
      sport: ['speedboat', 'center console', 'bowrider']
    };

    // Check if types are in the same category
    for (const category of Object.values(categories)) {
      const type1InCategory = category.includes(type1.toLowerCase());
      const type2InCategory = category.includes(type2.toLowerCase());
      
      if (type1InCategory && type2InCategory) return 80;
      if (type1InCategory || type2InCategory) return 40;
    }

    return 20;
  }

  /**
   * Find common features between two boats
   */
  findCommonFeatures(features1, features2) {
    return features1.filter(feature => 
      features2.some(f => f.toLowerCase() === feature.toLowerCase())
    );
  }

  /**
   * Find features unique to one boat
   */
  findUniqueFeatures(features1, features2) {
    return features1.filter(feature => 
      !features2.some(f => f.toLowerCase() === feature.toLowerCase())
    );
  }

  /**
   * Compare boat specifications
   */
  compareSpecifications(boat1, boat2) {
    return {
      engine: {
        match: boat1.engine === boat2.engine,
        values: [boat1.engine, boat2.engine]
      },
      hullMaterial: {
        match: boat1.hullMaterial === boat2.hullMaterial,
        values: [boat1.hullMaterial, boat2.hullMaterial]
      },
      engineHours: boat1.engineHours && boat2.engineHours ? {
        difference: Math.abs(boat1.engineHours - boat2.engineHours),
        values: [boat1.engineHours, boat2.engineHours]
      } : null,
      price: boat1.price && boat2.price ? {
        difference: Math.abs(boat1.price - boat2.price),
        percentDifference: Math.round(
          (Math.abs(boat1.price - boat2.price) / Math.min(boat1.price, boat2.price)) * 100
        ),
        values: [boat1.price, boat2.price]
      } : null
    };
  }

  /**
   * Clear the comparison cache
   */
  clearCache() {
    this.comparisonCache.clear();
  }
}

export const boatComparisonService = new BoatComparisonService();
