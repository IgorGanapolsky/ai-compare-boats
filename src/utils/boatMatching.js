// Boat matching utilities

import { analyzeBoatImage } from '../services/imageAnalysisService';

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
const calculateTypeMatchScore = (type1, type2) => {
    // Handle null/undefined values
    if (!type1 || !type2) return 0;

    // Normalize types by converting to lowercase and removing extra spaces
    // Ensure we're working with strings
    const normalizedType1 = String(type1).toLowerCase().trim();
    const normalizedType2 = String(type2).toLowerCase().trim();

    // Direct match
    if (normalizedType1 === normalizedType2) return 1;

    // Check if one type contains the other
    if (normalizedType1.includes(normalizedType2) || normalizedType2.includes(normalizedType1)) {
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
 * Calculate length match score between two boat lengths
 * @param {number} length1 - First boat length
 * @param {number} length2 - Second boat length
 * @returns {number} - Match score between 0-1
 */
const calculateLengthMatchScore = (length1, length2) => {
    if (!length1 || !length2) return 0;

    const lengthDiff = Math.abs(length1 - length2);
    const largerLength = Math.max(length1, length2);
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
 * Calculate feature match score between two boat features
 * @param {Array<string>} features1 - First boat features
 * @param {Array<string>} features2 - Second boat features
 * @returns {number} - Match score between 0-1
 */
const calculateFeatureMatchScore = (boat1, boat2) => {
    if (!boat1 || !boat2) return 0;

    let matchPoints = 0;
    let totalPoints = 0;

    // Compare boat type
    if (boat1.type && boat2.type) {
        totalPoints += 25;
        if (boat1.type.toLowerCase() === boat2.type.toLowerCase()) {
            matchPoints += 25;
        }
    }

    // Compare size/length (within 10%)
    if (boat1.length && boat2.length) {
        const length1 = parseFloat(boat1.length);
        const length2 = parseFloat(boat2.length);

        if (!isNaN(length1) && !isNaN(length2)) {
            totalPoints += 25;
            const sizeDiff = Math.abs(length1 - length2);
            const sizePercentDiff = sizeDiff / Math.max(length1, length2);

            if (sizePercentDiff <= 0.1) { // Within 10%
                matchPoints += 25;
            } else if (sizePercentDiff <= 0.2) { // Within 20%
                matchPoints += 15;
            }
        }
    }

    // Compare features
    const features1 = extractFeaturesFromBoat(boat1);
    const features2 = extractFeaturesFromBoat(boat2);

    if (features1.size > 0 && features2.size > 0) {
        totalPoints += 50;

        let commonFeatureCount = 0;
        for (const feature1 of features1) {
            for (const feature2 of features2) {
                if (areSimilarFeatures(feature1, feature2)) {
                    commonFeatureCount++;
                    break;
                }
            }
        }

        const featureMatchRate = commonFeatureCount / Math.max(features1.size, features2.size);
        matchPoints += Math.round(featureMatchRate * 50);
    }

    // Calculate final score (avoid division by zero)
    return totalPoints > 0 ? Math.round((matchPoints / totalPoints) * 100) : 0;
};

/**
 * Calculate name match score between two boats
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Match score between 0-1
 */
const calculateNameMatchScore = (boat1, boat2) => {
    if (!boat1?.name || !boat2?.name) return 0.5; // Neutral score if no names

    const name1 = boat1.name?.toLowerCase().trim() || '';
    const name2 = boat2.name?.toLowerCase().trim() || '';

    // Direct match
    if (name1 === name2) return 1;

    // Extract manufacturer and model
    const getManufacturer = (name) => {
        const parts = name.split(' ');
        return parts.length > 1 ? parts.slice(0, 2).join(' ') : name;
    };

    const mfg1 = getManufacturer(name1);
    const mfg2 = getManufacturer(name2);

    // Manufacturer match
    const mfgMatchScore = mfg1 === mfg2 ? 0.8 : (mfg1.includes(mfg2) || mfg2.includes(mfg1)) ? 0.7 : 0;

    // Model number similarities
    const getNumbers = str => (str.match(/\d+/g) || []).map(Number);
    const model1Numbers = getNumbers(name1);
    const model2Numbers = getNumbers(name2);

    let numberMatchScore = 0;
    if (model1Numbers.length > 0 && model2Numbers.length > 0) {
        // Check for matching numbers
        const matches = model1Numbers.filter(num => model2Numbers.includes(num));
        if (matches.length > 0) {
            numberMatchScore = 0.2 * (matches.length / Math.max(model1Numbers.length, model2Numbers.length));
        }
    }

    // Word similarities (excluding common words)
    const commonWords = ['and', 'with', 'the', 'a', 'an', 'for', 'to', 'in', 'on', 'at', 'boat'];
    const getKeywords = (str) => {
        return str.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
    };

    const words1 = getKeywords(name1);
    const words2 = getKeywords(name2);

    let wordMatchScore = 0;
    if (words1.length > 0 && words2.length > 0) {
        const matches = words1.filter(word => words2.includes(word));
        wordMatchScore = 0.2 * (matches.length / Math.max(words1.length, words2.length));
    }

    // Combined score (weighted)
    return Math.min(1, Math.round((mfgMatchScore + numberMatchScore + wordMatchScore) * 100) / 100);
};

/**
 * Calculate visual similarity between two boat images using OpenAI Vision API
 *
 * @param {Object} boat1 - First boat with image
 * @param {Object} boat2 - Second boat with image
 * @returns {Promise<number>} - Similarity score (0-1)
 */
const calculateVisualMatchScore = async (boat1, boat2) => {
    try {
        // For identical boats or boats with the same image URL, return perfect match
        if (boat1.id === boat2.id || boat1.imageUrl === boat2.imageUrl) {
            return 1;
        }

        // Check if we have URLs for both boats
        if (!boat1.imageUrl || !boat2.imageUrl) {
            throw createMatchingError("Missing image data for visual comparison", ERROR_TYPES.DATA_INCOMPLETE);
        }

        try {
            // Import OpenAI from the service
            const { compareBoatImages } = await import('../services/openaiService');

            // Call the OpenAI service to compare images
            console.log(`Comparing images between ${boat1.name || 'Unknown'} and ${boat2.name || 'Unknown'}`);
            const score = await compareBoatImages(boat1.imageUrl, boat2.imageUrl);
            return score / 100;
        } catch (apiError) {
            console.error('Error using OpenAI for visual matching:', apiError);

            // Structure the error better based on the type
            if (apiError.message && apiError.message.includes('rate limit')) {
                throw createMatchingError("OpenAI API rate limit exceeded", ERROR_TYPES.API_RATE_LIMIT, apiError);
            } else if (apiError.message && apiError.message.includes('API key')) {
                throw createMatchingError("Invalid or missing API key", ERROR_TYPES.API_TOKEN_INVALID, apiError);
            }

            // Fallback to simple heuristics if API is unavailable
            console.log('Falling back to basic visual matching');

            // Calculate basic type and length similarity as fallbacks
            let typeScore = 0;
            let lengthScore = 0;

            try {
                if (boat1.type === boat2.type) {
                    typeScore = 0.7;
                } else if (areBoatTypesRelated(boat1.type, boat2.type)) {
                    typeScore = 0.5;
                } else {
                    typeScore = 0.3;
                }
            } catch (error) {
                console.warn('Error calculating type similarity for fallback:', error);
                typeScore = 0.4; // Conservative default
            }

            try {
                if (boat1.length && boat2.length) {
                    const lengthDiff = Math.abs(boat1.length - boat2.length);
                    const maxLength = Math.max(boat1.length, boat2.length);
                    const diffPercentage = lengthDiff / maxLength;

                    if (diffPercentage <= 0.05) lengthScore = 0.8;      // Within 5%
                    else if (diffPercentage <= 0.1) lengthScore = 0.7;  // Within 10%
                    else if (diffPercentage <= 0.2) lengthScore = 0.5;  // Within 20%
                    else if (diffPercentage <= 0.3) lengthScore = 0.3;  // Within 30%
                    else lengthScore = 0.2;                            // Different sizes
                } else {
                    lengthScore = 0.3; // No length info, use conservative value
                }
            } catch (error) {
                console.warn('Error calculating length similarity for fallback:', error);
                lengthScore = 0.3; // Conservative default
            }

            // A basic visual score that's slightly conservative (40-70 range)
            const fallbackVisualScore = 0.4 + ((typeScore + lengthScore) / 2) * 0.3;

            console.log(`Using fallback visual score: ${Math.round(fallbackVisualScore * 100) / 100}`);
            return fallbackVisualScore;
        }
    } catch (error) {
        console.error('Error in visual matching:', error);
        // If it's already a structured error, rethrow it
        if (error.type) {
            throw error;
        }
        // Otherwise create a structured error
        throw createMatchingError(`Visual comparison failed: ${error.message}`, ERROR_TYPES.GENERAL_ERROR, error);
    }
};

/**
 * Calculate a single component score with error handling
 * @param {Function} calculationFn - The scoring function to use
 * @param {any} param1 - First parameter to pass to the calculation function
 * @param {any} param2 - Second parameter to pass to the calculation function
 * @param {string} componentName - Name of the component for logging
 * @param {number} fallbackScore - Score to use if calculation fails
 * @returns {number} - The calculated score or fallback value
 */
const calculateComponentScore = (calculationFn, param1, param2, componentName, fallbackScore = 50) => {
    try {
        const score = calculationFn(param1, param2);
        // Convert 0-1 scale to 0-100 scale if needed
        return (score <= 1 && score >= 0) ? score * 100 : score;
    } catch (error) {
        console.warn(`${componentName} matching error: ${error.message}`);
        return fallbackScore;
    }
};

/**
 * Calculate visual match score with special error handling
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {Promise<number>} - Visual match score or fallback value
 */
const calculateVisualScore = async (boat1, boat2) => {
    // Skip visual match if images are missing
    if (!boat1.image || !boat2.image) {
        console.log('Skipping visual match - one or both boats missing images');
        return 50;
    }

    try {
        const score = await calculateVisualMatchScore(boat1, boat2) * 100;
        console.log(`Visual match score: ${score}`);
        return score;
    } catch (error) {
        // For API key errors, these are critical so rethrow
        if (error.type === ERROR_TYPES.API_TOKEN_INVALID) {
            throw createMatchingError("Invalid or missing API key for image matching.", ERROR_TYPES.API_TOKEN_INVALID, error);
        }

        // For other errors, use fallback score
        console.warn(`Visual matching error: ${error.message}`);
        return 40; // Slightly below average as a conservative estimate
    }
};

/**
 * Calculate a match score between two boats based on features, type, and other criteria
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Match score from 0-100
 */
export const calculateMatchScore = async (boat1, boat2) => {
    if (!boat1 || !boat2) return 0;

    // Base score from feature comparison
    const featureScore = calculateFeatureMatchScore(boat1, boat2);

    // Get image-based score if images are available
    let imageScore = 0;
    if (boat1.imageUrl && boat2.imageUrl) {
        try {
            imageScore = await getImageComparisonScore(boat1.imageUrl, boat2.imageUrl);
        } catch (error) {
            console.error('Error getting image comparison score:', error);
            // Continue with just feature comparison if image analysis fails
        }
    }

    // Weight the scores (can be adjusted based on what proves most accurate)
    const weightedScore = featureScore * 0.6 + imageScore * 0.4;

    // Return rounded score
    return Math.round(weightedScore);
};

/**
 * Gets a similarity score based on image analysis using GPT-4o
 * @param {string} imageUrl1 - URL of first boat image
 * @param {string} imageUrl2 - URL of second boat image
 * @returns {Promise<number>} - Match score from 0-100
 */
const getImageComparisonScore = async (imageUrl1, imageUrl2) => {
    try {
        // Call the GPT-4o image analysis service
        const analysisResult = await analyzeBoatImage(imageUrl1, imageUrl2);
        return analysisResult.similarityScore;
    } catch (error) {
        console.error('Error in image comparison:', error);
        throw error;
    }
};

/**
 * Extract features from a boat object
 * @param {Object} boat - Boat to extract features from
 * @returns {Set} - Set of normalized features
 */
const extractFeaturesFromBoat = (boat) => {
    const features = new Set();

    if (!boat) return features;

    const normalizeFeature = (feature) => {
        if (typeof feature !== 'string') return '';

        return feature.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\b(for|with|and|the|a|an|to|in|on|of)\b/g, '')
            .trim();
    };

    // Collect features from all possible feature sources
    if (Array.isArray(boat.features)) {
        boat.features.forEach(f => {
            const normalized = normalizeFeature(f);
            if (normalized) features.add(normalized);
        });
    }

    if (Array.isArray(boat.keyFeatures)) {
        boat.keyFeatures.forEach(f => {
            const normalized = normalizeFeature(f);
            if (normalized) features.add(normalized);
        });
    }

    if (Array.isArray(boat.style)) {
        boat.style.forEach(s => {
            const normalized = normalizeFeature(s);
            if (normalized) features.add(normalized);
        });
    }

    return features;
};

/**
 * Check if two features are similar
 * @param {string} feature1 - First feature
 * @param {string} feature2 - Second feature
 * @returns {boolean} - True if features are similar
 */
const areSimilarFeatures = (feature1, feature2) => {
    // Exact match
    if (feature1 === feature2) return true;

    // One contains the other
    if (feature1.includes(feature2) || feature2.includes(feature1)) return true;

    // Split into words and check for common words
    const words1 = feature1.split(/\s+/).filter(Boolean);
    const words2 = feature2.split(/\s+/).filter(Boolean);

    // Empty features shouldn't match
    if (words1.length === 0 || words2.length === 0) return false;

    // Calculate word overlap
    const commonWords = words1.filter(word =>
        words2.some(w2 => w2.includes(word) || word.includes(w2))
    );

    // Calculate similarity score
    const similarityScore = commonWords.length / Math.max(words1.length, words2.length);

    // Consider features similar if they share enough words
    return similarityScore >= 0.5;
};

/**
 * Constants for matching algorithm
 */
const MATCH_WEIGHTS = {
    typeMatch: 40,
    lengthMatch: 25,
    visualMatch: 20,
    nameMatch: 10,
    featureMatch: 5
};

/**
 * Error types for better handling and reporting
 */
const ERROR_TYPES = {
    API_UNAVAILABLE: 'api_unavailable',
    API_RATE_LIMIT: 'api_rate_limit',
    API_TOKEN_INVALID: 'api_token_invalid',
    DATA_INCOMPLETE: 'data_incomplete',
    TYPE_MISMATCH: 'type_mismatch',
    GENERAL_ERROR: 'general_error'
};

/**
 * Helper to create a structured error with type
 * @param {string} message Error message
 * @param {string} type Error type from ERROR_TYPES
 * @param {*} originalError Original error if available
 * @returns {Error} Enhanced error object
 */
const createMatchingError = (message, type = ERROR_TYPES.GENERAL_ERROR, originalError = null) => {
    const error = new Error(message);
    error.type = type;
    error.originalError = originalError;
    return error;
};

export {
    normalizeBoatData,
    getBoatLength,
    areBoatTypesRelated,
    calculateFeatureMatchScore,
    MATCH_WEIGHTS,
    ERROR_TYPES,
    createMatchingError,
    getImageComparisonScore,
    extractFeaturesFromBoat,
    areSimilarFeatures
};
