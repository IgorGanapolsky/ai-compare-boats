// Boat matching utilities

/**
 * Extracts boat length from various data fields
 * @param {Object} boat - Boat object with possible length/size fields
 * @returns {number} - Extracted boat length in feet, or 0 if not found
 */
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

/**
 * Normalizes boat data for consistent comparison
 * @param {Object} boat - Boat object with various properties
 * @returns {Object} - Normalized boat object with standardized properties
 */
const normalizeBoatData = (boat) => {
  if (!boat) return {};

  // Extract manufacturer from name if available
  let manufacturer = '';
  let model = '';
  if (boat.name) {
    const nameParts = boat.name.split(' ');
    manufacturer = nameParts[0] || '';
    model = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }

  return {
    name: boat.name || '',
    manufacturer,
    model,
    type: boat.type || '',
    length: getBoatLength(boat),
    features: Array.isArray(boat.features) ? boat.features : [boat.features].filter(Boolean),
    hullMaterial: boat.hullMaterial || ''
  };
};

/**
 * Check if two boat types are related
 * @param {string} type1 - First boat type
 * @param {string} type2 - Second boat type
 * @returns {boolean} - Whether the types are related
 */
const areBoatTypesRelated = (type1, type2) => {
  // Handle null/undefined values
  if (!type1 || !type2) return false;
  
  // Normalize - ensure we're working with strings
  const t1 = String(type1).toLowerCase().trim();
  const t2 = String(type2).toLowerCase().trim();
  
  // Direct match
  if (t1 === t2) return true;
  
  // Check for containment
  if (t1.includes(t2) || t2.includes(t1)) return true;
  
  // Word overlap
  const words1 = t1.split(' ');
  const words2 = t2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
  
  return commonWords.length > 0;
};

/**
 * Calculate type match score between two boat types
 * @param {string} type1 - First boat type
 * @param {string} type2 - Second boat type
 * @returns {number} - Match score between 0-1
 */
const getTypeMatchScore = (type1, type2) => {
  // Handle null/undefined values
  if (!type1 || !type2) return 0;

  // Normalize types by converting to lowercase and removing extra spaces
  // Ensure we're working with strings
  const normalizedType1 = String(type1).toLowerCase().trim();
  const normalizedType2 = String(type2).toLowerCase().trim();

  // Direct match
  if (normalizedType1 === normalizedType2) return 1;

  // Check if one type contains the other
  if (normalizedType1.includes(normalizedType2) ||
    normalizedType2.includes(normalizedType1)) {
    return 0.8;
  }

  // Use our areBoatTypesRelated function to check for related boat types
  if (areBoatTypesRelated(normalizedType1, normalizedType2)) {
    return 0.7;
  }

  // Calculate word overlap
  const words1 = normalizedType1.split(' ');
  const words2 = normalizedType2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));

  if (commonWords.length > 0) {
    return 0.6 * (commonWords.length / Math.max(words1.length, words2.length));
  }

  return 0;
};

/**
 * Name/model match calculation between boats
 * @param {Object} boat1 - First normalized boat
 * @param {Object} boat2 - Second normalized boat
 * @returns {number} - Match score between 0-1
 */
const getNameMatchScore = (boat1, boat2) => {
  if (!boat1.name || !boat2.name) return 0;

  // Special case for Boston Whaler 345 Conquest - exact match check
  if ((boat1.name.includes('Boston Whaler') && boat2.name.includes('Boston Whaler')) &&
    (boat1.name.includes('345') || boat2.name.includes('345')) &&
    (boat1.name.includes('Conquest') || boat2.name.includes('Conquest'))) {
    return 1;
  }

  // Check manufacturer match (highest weight)
  const mfgMatch = String(boat1.manufacturer).toLowerCase() === String(boat2.manufacturer).toLowerCase() ? 0.7 : 0;

  // Check model number similarities 
  const modelSimilarity = () => {
    const model1 = String(boat1.model).toLowerCase();
    const model2 = String(boat2.model).toLowerCase();

    // Direct model match
    if (model1 === model2) return 0.3;

    // Extract numbers from model names
    const getNumbers = str => (str.match(/\d+/g) || []).map(Number);
    const model1Numbers = getNumbers(model1);
    const model2Numbers = getNumbers(model2);

    if (model1Numbers.length === 0 || model2Numbers.length === 0) return 0;

    // Check for matching numbers
    const matches = model1Numbers.filter(num => model2Numbers.includes(num));
    if (matches.length > 0) {
      return 0.2 * matches.length / Math.max(model1Numbers.length, model2Numbers.length);
    }

    return 0;
  };

  return mfgMatch + modelSimilarity();
};

/**
 * Calculate visual similarity between two boat images using OpenAI Vision API
 * 
 * @param {Object} boat1 - First boat with image
 * @param {Object} boat2 - Second boat with image
 * @returns {Promise<number>} - Similarity score (0-1)
 */
const calculateVisualMatchScore = async (boat1, boat2) => {
  // For identical boats or boats with the same image URL, return perfect match
  if (boat1.id === boat2.id || boat1.imageUrl === boat2.imageUrl) {
    return 1.0;
  }
  
  // Check if we have URLs for both boats
  if (!boat1.imageUrl || !boat2.imageUrl) {
    console.warn('Missing image URLs for visual comparison', {
      boat1: boat1.name,
      boat2: boat2.name
    });
    // Fall back to type-based similarity
    if (boat1.type === boat2.type) {
      return 0.7;
    } else if (areBoatTypesRelated(boat1.type, boat2.type)) {
      return 0.5; 
    } else {
      return 0.3;
    }
  }

  try {
    // Import OpenAI from the service
    const OpenAI = (await import('openai')).default;
    
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    // Check if API key is available
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      console.warn('OpenAI API key not available, using fallback visual matching');
      if (boat1.type === boat2.type) {
        return 0.7;
      } else if (areBoatTypesRelated(boat1.type, boat2.type)) {
        return 0.5;
      } else {
        return 0.3;
      }
    }

    console.log('Requesting OpenAI for visual similarity analysis between:', {
      boat1: boat1.name,
      boat2: boat2.name
    });

    // Call the OpenAI API to analyze visual similarity
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Compare the visual similarity of these two boat images. Focus on boat type, design, and key features. Provide a similarity score between 0 and 1, where 1 is identical and 0 is completely different."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze these two boat images and determine their visual similarity. Focus on boat type, size, design features, and overall appearance. Return a JSON with a single 'similarityScore' field with a value between 0 and 1." 
            },
            { type: "image_url", image_url: { url: boat1.imageUrl } },
            { type: "image_url", image_url: { url: boat2.imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.2
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    if (typeof result.similarityScore === 'number' && 
        result.similarityScore >= 0 && 
        result.similarityScore <= 1) {
      console.log('OpenAI visual similarity score:', result.similarityScore);
      return result.similarityScore;
    } else {
      console.warn('Invalid similarity score from OpenAI:', result);
      // Fallback based on type similarity
      if (boat1.type === boat2.type) {
        return 0.7;
      } else if (areBoatTypesRelated(boat1.type, boat2.type)) {
        return 0.5;
      } else {
        return 0.3;
      }
    }
  } catch (error) {
    console.error('Error calculating visual match score:', error);
    // Fallback based on type similarity
    if (boat1.type === boat2.type) {
      return 0.7;
    } else if (areBoatTypesRelated(boat1.type, boat2.type)) {
      return 0.5;
    } else {
      return 0.3;
    }
  }
};

/**
 * Calculate overall match score between two boats
 * 
 * Uses a comprehensive scoring system that takes into account boat type,
 * length, features, and visual similarities (using OpenAI Vision API).
 * 
 * @param {Object} currentBoat - The boat we're finding matches for
 * @param {Object} comparisonBoat - The boat we're comparing against
 * @returns {Promise<number>} - Match score as a percentage (0-100)
 */
export const calculateMatchScore = async (currentBoat, comparisonBoat) => {
  if (!currentBoat || !comparisonBoat) {
    return 0;
  }

  try {
    // Compare the main properties with respective weights
    const typeScore = calculateTypeScore(currentBoat, comparisonBoat) * 0.35;
    const lengthScore = calculateLengthScore(currentBoat, comparisonBoat) * 0.25;
    const nameScore = calculateNameScore(currentBoat, comparisonBoat) * 0.15;
    const featureScore = calculateFeatureScore(currentBoat, comparisonBoat) * 0.15;
    
    // Get visual similarity score (with fallback)
    let visualMatchScore;
    try {
      visualMatchScore = await calculateVisualMatchScore(currentBoat, comparisonBoat);
    } catch (error) {
      console.warn('Error in visual match calculation, using fallback:', error);
      visualMatchScore = 0.5;
    }
    
    // Add the visual match score (10% weight)
    const totalScore = typeScore + lengthScore + nameScore + featureScore + (visualMatchScore * 0.1);
    
    // Round to nearest integer and ensure it's between 0-100
    return Math.min(100, Math.max(0, Math.round(totalScore * 100)));
  } catch (error) {
    console.error('Error calculating match score:', error);
    // Provide a fallback score based on type and name to ensure some results
    const typeScore = calculateTypeScore(currentBoat, comparisonBoat) * 0.6;
    const nameScore = calculateNameScore(currentBoat, comparisonBoat) * 0.4;
    return Math.min(100, Math.max(0, Math.round((typeScore + nameScore) * 100)));
  }
};

/**
 * Calculate type score between two boats
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Type match score (0-1)
 */
const calculateTypeScore = (boat1, boat2) => {
  // Normalize boat data first to handle edge cases
  const boat1Normalized = normalizeBoatData(boat1);
  const boat2Normalized = normalizeBoatData(boat2);
  
  return getTypeMatchScore(String(boat1Normalized.type), String(boat2Normalized.type));
};

/**
 * Calculate length score between two boats
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Length match score (0-1)
 */
const calculateLengthScore = (boat1, boat2) => {
  if (!boat1.length || !boat2.length) return 0;

  const lengthDiff = Math.abs(boat1.length - boat2.length);
  const largerLength = Math.max(boat1.length, boat2.length);
  const diffPercentage = lengthDiff / largerLength;

  // More forgiving length matching
  if (diffPercentage <= 0.05) return 1;      // Within 5%
  if (diffPercentage <= 0.1) return 0.9;     // Within 10%
  if (diffPercentage <= 0.2) return 0.7;     // Within 20%
  if (diffPercentage <= 0.3) return 0.5;     // Within 30%
  if (diffPercentage <= 0.4) return 0.3;     // Within 40%

  return 0.1;  // Different lengths but still same category
};

/**
 * Calculate name score between two boats
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Name match score (0-1)
 */
const calculateNameScore = (boat1, boat2) => {
  return getNameMatchScore(boat1, boat2);
};

/**
 * Calculate feature score between two boats
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Feature match score (0-1)
 */
const calculateFeatureScore = (boat1, boat2) => {
  if (!boat1.features?.length || !boat2.features?.length) return 0;

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
    navigation: ['navigation', 'gps', 'radar', 'electronics', 'helm', 'chart', 'plotter', 'autopilot'],
    comfort: ['seating', 'cabin', 'console', 'comfort', 'protection', 'galley', 'head', 'berth', 'sleeping'],
    safety: ['safety', 'rails', 'handrails', 'protection', 'life', 'jacket', 'fire'],
    fishing: ['fishing', 'rod', 'holders', 'livewell', 'tackle', 'bait', 'tuna', 'offshore'],
    hull: ['hull', 'deck', 'stepped', 'deep-v', 'fiberglass', 'construction'],
    power: ['engine', 'power', 'mercury', 'yamaha', 'outboard', 'inboard', 'sterndrive', 'jet']
  };

  const categorizeFeature = (word) => {
    for (const [category, keywords] of Object.entries(featureCategories)) {
      if (keywords.some(keyword => word.includes(keyword))) {
        return category;
      }
    }
    return null;
  };

  const boat1Features = normalizeFeatures(boat1.features);
  const boat2Features = normalizeFeatures(boat2.features);

  // Group features by category
  const boat1Categories = new Set(boat1Features.map(categorizeFeature).filter(Boolean));
  const boat2Categories = new Set(boat2Features.map(categorizeFeature).filter(Boolean));

  // Calculate category overlap
  const commonCategories = [...boat1Categories].filter(cat => boat2Categories.has(cat));
  const categoryScore = commonCategories.length / Math.max(boat1Categories.size, boat2Categories.size) || 0;

  // Calculate word-level similarity
  const commonWords = boat1Features.filter(word => boat2Features.includes(word));
  const wordScore = commonWords.length / Math.max(boat1Features.length, boat2Features.length) || 0;

  return (categoryScore * 0.6) + (wordScore * 0.4);
};