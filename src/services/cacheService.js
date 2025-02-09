class CacheService {
  constructor() {
    this.CACHE_KEY = 'boats_cache';
    this.ANALYSIS_CACHE_KEY = 'analysis_cache';
  }

  async cacheBoat(boat) {
    try {
      const cachedBoats = this.getAllCachedBoats();
      const existingIndex = cachedBoats.findIndex(b => b.id === boat.id);
      
      if (existingIndex >= 0) {
        cachedBoats[existingIndex] = boat;
      } else {
        cachedBoats.push(boat);
      }
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedBoats));
    } catch (error) {
      console.error('Error caching boat:', error);
      throw error;
    }
  }

  getAllCachedBoats() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached boats:', error);
      return [];
    }
  }

  async findSimilarBoats(queryBoat, limit = 5) {
    try {
      const cachedBoats = this.getAllCachedBoats();
      const similarities = [];

      for (const boat of cachedBoats) {
        // Calculate similarity score using our algorithm
        const typeScore = this.calculateTypeScore(queryBoat.type, boat.type);
        const lengthScore = this.calculateLengthScore(queryBoat.length, boat.length);
        const featureScore = this.calculateFeatureScore(queryBoat.features, boat.features);
        
        const totalScore = typeScore + lengthScore + featureScore;
        
        similarities.push({
          boat,
          similarity: {
            total: totalScore,
            typeScore,
            lengthScore,
            featureScore
          }
        });
      }

      // Sort by similarity score and return top matches
      return similarities
        .sort((a, b) => b.similarity.total - a.similarity.total)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar boats:', error);
      return [];
    }
  }

  calculateTypeScore(type1, type2) {
    if (!type1 || !type2) return 0;
    
    type1 = type1.toLowerCase();
    type2 = type2.toLowerCase();
    
    if (type1 === type2) return 40;
    
    const categories = {
      sailing: ['sailboat', 'sailing yacht', 'sail'],
      motor: ['motor yacht', 'powerboat', 'cruiser'],
      luxury: ['yacht', 'cruiser', 'motor yacht'],
      sport: ['speedboat', 'center console', 'bowrider']
    };

    // Check if boats are in the same or related categories
    for (const category of Object.values(categories)) {
      const boat1InCategory = category.some(t => type1.includes(t));
      const boat2InCategory = category.some(t => type2.includes(t));
      
      if (boat1InCategory && boat2InCategory) return 30;
      if ((boat1InCategory && category.some(t => type2.includes(t))) ||
          (boat2InCategory && category.some(t => type1.includes(t)))) {
        return 20;
      }
    }

    return 0;
  }

  calculateLengthScore(length1, length2) {
    if (!length1 || !length2) return 0;
    
    const diff = Math.abs(length1 - length2);
    if (diff === 0) return 30;
    if (diff <= 2) return 25;
    if (diff <= 5) return 20;
    if (diff <= 8) return 15;
    if (diff <= 10) return 10;
    return 0;
  }

  calculateFeatureScore(features1, features2) {
    if (!features1 || !features2 || features1.length === 0 || features2.length === 0) {
      return 0;
    }
    
    const normalizedFeatures1 = features1.map(f => f.toLowerCase());
    const normalizedFeatures2 = features2.map(f => f.toLowerCase());
    
    const matchingFeatures = normalizedFeatures1.filter(f1 => 
      normalizedFeatures2.some(f2 => f2.includes(f1) || f1.includes(f2))
    );
    
    const matchPercentage = matchingFeatures.length / Math.max(features1.length, features2.length);
    return Math.round(matchPercentage * 30);
  }

  async cacheAnalysis(imageBase64, results) {
    try {
      const cache = this.getAnalysisCache();
      cache[imageBase64] = {
        results,
        timestamp: Date.now()
      };
      localStorage.setItem(this.ANALYSIS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching analysis:', error);
    }
  }

  async getCachedAnalysis(imageBase64) {
    try {
      const cache = this.getAnalysisCache();
      const cached = cache[imageBase64];
      
      if (!cached) return null;
      
      // Cache expires after 24 hours
      if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
        delete cache[imageBase64];
        localStorage.setItem(this.ANALYSIS_CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return cached.results;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  getAnalysisCache() {
    try {
      const cached = localStorage.getItem(this.ANALYSIS_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Error getting analysis cache:', error);
      return {};
    }
  }

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export const cacheService = new CacheService();
