/**
 * Utility functions for boat matching and comparison
 * Using GPT-4o and TensorFlow.js for enhanced boat matching
 */

import { analyzeBoatImage } from '../services/imageAnalysisService';
import { compareImages } from '../services/tensorflowService';

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
 * CORE BOAT MATCHING ALGORITHM
 * Calculate a match score between two boats
 * @param {Object} sourceBoat - The source boat to compare from
 * @param {Object} targetBoat - The target boat to compare to
 * @returns {Promise<number>} - Match percentage between the boats
 */
export const calculateMatchScore = async (sourceBoat, targetBoat) => {
    // Validate inputs
    if (!sourceBoat || !targetBoat) {
        console.warn('Missing boat data for comparison');
        return 50; // Default when missing data
    }

    try {
        console.log(`Comparing boats: "${sourceBoat?.name || 'Unknown'}" vs "${targetBoat?.name || 'Unknown'}"`);

        // 1. IDENTICAL BOAT CHECK - Fast path for same boat
        if (boatsAreIdentical(sourceBoat, targetBoat)) {
            console.log('✓ IDENTICAL BOATS - 100% match');
            return 100;
        }

        // 2. VISUAL COMPARISON - If both boats have images, use TensorFlow image similarity
        if (sourceBoat?.imageUrl && targetBoat?.imageUrl) {
            try {
                console.log('Performing TensorFlow visual similarity analysis...');
                const visualSimilarity = await compareImages(sourceBoat.imageUrl, targetBoat.imageUrl);
                console.log(`Visual similarity between boats: ${visualSimilarity}%`);
                
                // If visual similarity is very high, trust it more
                if (visualSimilarity > 80) {
                    // For high visual similarity, heavily weight the visual score
                    // but still blend with some text analysis for robustness
                    const textScore = await calculateEnhancedTextScore(sourceBoat, targetBoat);
                    const blendedScore = (visualSimilarity * 0.8) + (textScore * 0.2);
                    console.log(`High visual similarity detected (${visualSimilarity}%), blended with text score: ${blendedScore.toFixed(1)}%`);
                    return Math.round(blendedScore);
                }
                
                // For medium visual similarity, blend visual and text scores more evenly
                if (visualSimilarity > 50) {
                    // For medium visual similarity, blend scores more evenly
                    const textScore = await calculateEnhancedTextScore(sourceBoat, targetBoat);
                    const blendedScore = (visualSimilarity * 0.6) + (textScore * 0.4);
                    console.log(`Medium visual similarity (${visualSimilarity}%), blended with text score: ${blendedScore.toFixed(1)}%`);
                    return Math.round(blendedScore);
                }
            } catch (visualError) {
                console.error('Error during visual comparison:', visualError);
                // Continue to other comparison methods
            }
        }

        // 3. For the user's uploaded boat (sourceBoat) with image:
        // - First, analyze it with GPT-4o only once (if not already analyzed)
        // - Then use local comparison against sampleBoats
        if (sourceBoat?.imageUrl) {
            try {
                console.log('Performing one-time analysis of uploaded boat image...');

                // We don't need to pass the target boat image to OpenAI
                // We'll just analyze the source (uploaded) boat once
                if (sourceBoat.name === 'Your Reference Boat') {
                    // This is the uploaded boat. Check if it has already been analyzed
                    // Check for already extracted features
                    const hasExtractedFeatures = sourceBoat.keyFeatures && 
                                              sourceBoat.keyFeatures.length > 0 && 
                                              sourceBoat.type;
                    
                    if (!hasExtractedFeatures) {
                        // We need to analyze the uploaded boat with GPT-4o
                        console.log('Analyzing user uploaded boat with GPT-4o...');
                        // Make the API call for the uploaded boat only
                        const sourceBoatFeatures = await analyzeBoatImage(sourceBoat.imageUrl, null);
                        
                        // Store the features on the sourceBoat object for future comparisons
                        Object.assign(sourceBoat, sourceBoatFeatures);
                    }
                }
                
                // Now compare the analyzed source boat with the target boat using local comparison
                console.log('Using enhanced text-based comparison between boats...');
                return calculateEnhancedTextScore(sourceBoat, targetBoat);
            } catch (analysisError) {
                console.error('Error during image analysis:', analysisError);
                // Continue to fallback methods
            }
        } else {
            console.log('⚠️ Missing image URLs, using text-based comparison');
        }

        // 4. FALLBACK - Use metadata comparison
        return calculateTextBasedMatchScore(sourceBoat, targetBoat);

    } catch (error) {
        console.error('Error in boat matching:', error);
        return 45; // Conservative fallback
    }
};

/**
 * Enhanced text score calculation that gives higher weight to critical features
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {Promise<number>} - Match percentage (0-100)
 */
export const calculateEnhancedTextScore = async (boat1, boat2) => {
    // Start with basic text-based matching
    const baseScore = calculateTextBasedMatchScore(boat1, boat2);
    
    // Extract normalized boats
    const normalizedBoat1 = normalizeBoatData(boat1);
    const normalizedBoat2 = normalizeBoatData(boat2);
    
    // Increase weight for exact type matches
    let bonusPoints = 0;
    
    // Add bonus for exact type match
    if (normalizedBoat1.type && 
        normalizedBoat2.type && 
        normalizedBoat1.type.toLowerCase() === normalizedBoat2.type.toLowerCase()) {
        bonusPoints += 10;
    }
    
    // Add bonus for exact length match (within 1 foot)
    if (normalizedBoat1.length && 
        normalizedBoat2.length && 
        Math.abs(normalizedBoat1.length - normalizedBoat2.length) <= 1) {
        bonusPoints += 5;
    }
    
    // Add bonus for hull material match
    if (normalizedBoat1.hullMaterial && 
        normalizedBoat2.hullMaterial && 
        normalizedBoat1.hullMaterial.toLowerCase() === normalizedBoat2.hullMaterial.toLowerCase()) {
        bonusPoints += 5;
    }
    
    // Calculate enhanced score with bonuses, capped at 99
    const enhancedScore = Math.min(99, baseScore + bonusPoints);
    
    console.log(`Enhanced text score: ${baseScore} + ${bonusPoints} bonus = ${enhancedScore}`);
    return enhancedScore;
};

/**
 * Check if two boats are identical based on ID, name, or image
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {boolean} - Whether the boats are identical
 */
const boatsAreIdentical = (boat1, boat2) => {
    // Same object reference
    if (boat1 === boat2) return true;

    // Check IDs if available
    if (boat1?.id && boat2?.id && boat1.id === boat2.id) {
        return true;
    }

    // Check image URLs if exact match
    if (boat1?.imageUrl && boat2?.imageUrl) {
        const url1 = boat1.imageUrl.toLowerCase();
        const url2 = boat2.imageUrl.toLowerCase();

        // Exact URL match
        if (url1 === url2) {
            console.log('Identical image URLs detected - 100% match');
            return true;
        }

        // Strip query params for comparison
        const baseUrl1 = url1.split('?')[0].split('#')[0];
        const baseUrl2 = url2.split('?')[0].split('#')[0];

        if (baseUrl1 === baseUrl2 && baseUrl1 !== '') {
            console.log('Identical base image URLs detected - 100% match');
            return true;
        }
    }

    // Check for identical name with decent length (not generic)
    const isNameMeaningful = (name) => {
        if (!name || typeof name !== 'string') return false;
        if (name.length < 5) return false;

        const genericNames = ['boat', 'vessel', 'ship', 'yacht', 'watercraft', 'unknown'];
        return !genericNames.includes(name.toLowerCase());
    };

    if (boat1?.name && boat2?.name &&
        boat1.name === boat2.name &&
        isNameMeaningful(boat1.name)) {
        return true;
    }

    return false;
};

/**
 * Calculate a match score based on text metadata when images aren't available
 * @param {Object} boat1 - First boat
 * @param {Object} boat2 - Second boat
 * @returns {number} - Match percentage (0-100)
 */
const calculateTextBasedMatchScore = (boat1, boat2) => {
    console.log('Using text-based matching algorithm');

    // Initialize component scores
    let typeScore = 0;
    let lengthScore = 0;
    let nameScore = 0;
    let featureScore = 0;

    // Track which components we could calculate
    const componentWeights = {
        type: 0,
        length: 0,
        name: 0,
        features: 0
    };

    // 1. Type comparison (highest weight)
    if (boat1?.type && boat2?.type) {
        typeScore = calculateTypeMatchScore(boat1.type, boat2.type);
        componentWeights.type = 0.4; // 40% weight
        console.log(`Type match: ${Math.round(typeScore * 100)}%`);
    }

    // 2. Length comparison
    const length1 = parseFloat(boat1?.length || 0);
    const length2 = parseFloat(boat2?.length || 0);

    if (length1 > 0 && length2 > 0) {
        lengthScore = calculateLengthMatchScore(length1, length2);
        componentWeights.length = 0.3; // 30% weight
        console.log(`Length match: ${Math.round(lengthScore * 100)}%`);
    }

    // 3. Name comparison
    if (boat1?.name && boat2?.name) {
        nameScore = calculateNameMatchScore(boat1, boat2);
        componentWeights.name = 0.2; // 20% weight
        console.log(`Name match: ${Math.round(nameScore * 100)}%`);
    }

    // 4. Feature comparison
    if ((boat1?.features && boat1.features.length > 0) ||
        (boat2?.features && boat2.features.length > 0)) {
        featureScore = calculateFeatureMatchScore(boat1, boat2) / 100; // Convert to 0-1 range
        componentWeights.features = 0.1; // 10% weight
        console.log(`Feature match: ${Math.round(featureScore * 100)}%`);
    }

    // Calculate weighted average
    const totalWeight = Object.values(componentWeights).reduce((sum, weight) => sum + weight, 0);

    if (totalWeight === 0) {
        console.warn('No comparable attributes found between boats');
        return 50; // Default when no comparison possible
    }

    const weightedSum =
        (typeScore * componentWeights.type) +
        (lengthScore * componentWeights.length) +
        (nameScore * componentWeights.name) +
        (featureScore * componentWeights.features);

    const finalScore = Math.round((weightedSum / totalWeight) * 100);
    console.log(`Final text-based match score: ${finalScore}%`);

    return finalScore;
};

/**
 * Extract relevant features from a boat object
 * @param {Object} boat - Boat object
 * @returns {Array} - Array of features
 */
export const extractFeaturesFromBoat = (boat) => {
    if (!boat) return [];

    try {
        // Extract features array
        let features = [];

        if (Array.isArray(boat.features)) {
            features = [...boat.features];
        } else if (boat.features) {
            features = [boat.features];
        }

        // Add additional properties as features if they exist
        const additionalFeatures = [];

        if (boat.engine) additionalFeatures.push(`Engine: ${boat.engine}`);
        if (boat.hullMaterial) additionalFeatures.push(`Hull: ${boat.hullMaterial}`);
        if (boat.fuelType) additionalFeatures.push(`Fuel: ${boat.fuelType}`);
        if (boat.propulsionType) additionalFeatures.push(`Propulsion: ${boat.propulsionType}`);

        return [...features, ...additionalFeatures].filter(Boolean);
    } catch (error) {
        console.warn('Error extracting features:', error);
        return [];
    }
};

/**
 * Determine if two sets of features are similar
 * @param {Object} feature1 - First feature string
 * @param {Object} feature2 - Second feature string
 * @returns {boolean} - Whether features are similar
 */
export const areSimilarFeatures = (feature1, feature2) => {
    if (!feature1 || !feature2) return false;

    try {
        // Convert to strings and normalize
        const f1 = String(feature1).toLowerCase().trim();
        const f2 = String(feature2).toLowerCase().trim();

        // Exact match
        if (f1 === f2) return true;

        // One contains the other
        if (f1.includes(f2) || f2.includes(f1)) return true;

        // Calculate word similarity
        const words1 = f1.split(/\s+/);
        const words2 = f2.split(/\s+/);

        if (words1.length && words2.length) {
            // Count common words
            const commonWords = words1.filter(word =>
                word.length > 3 && words2.includes(word)
            );

            // More than 50% words in common
            if (commonWords.length >= Math.min(words1.length, words2.length) * 0.5) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.warn('Error comparing features:', error);
        return false;
    }
};

/**
 * Constants for matching algorithm
 */
const MATCH_WEIGHTS = {
    type: 0.4,    // 40%
    length: 0.3,  // 30%
    name: 0.2,    // 20%
    features: 0.1 // 10%
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

// Export additional utilities that may be used elsewhere
export {
    normalizeBoatData,
    getBoatLength,
    areBoatTypesRelated,
    calculateFeatureMatchScore,
    MATCH_WEIGHTS,
    ERROR_TYPES
};
