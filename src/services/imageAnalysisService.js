/**
 * Service for analyzing boat images using GPT-4o
 * This service only uploads the user's image to OpenAI once, then compares features locally
 */

// Import the OpenAI analysis function for single image analysis
import {analyzeBoatImage as openaiAnalyzeBoatImage} from '../services/openaiService';
import {compareImages} from '../services/tensorflowService';
import sampleBoats from '../data/sampleBoats';

// Global variable to track if we're already analyzing an image
let isAnalyzing = false;
let progressInterval = null;

// Cache for analyzed user images
const analyzedImageCache = new Map();

// Debug mode - set to false in production to reduce console noise
const DEBUG = true; // Enable debug for troubleshooting

/**
 * Debug logging function that only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
const debugLog = (...args) => {
    if (DEBUG) {
        console.log('[BoatAnalysis]', ...args);
    }
};

/**
 * Safe URL normalization to prevent errors
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
const safeNormalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return '';

    try {
        // First try using URL API
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.origin + parsedUrl.pathname;
        } catch (e) {
            // Fallback to simple string operations
            return url.split('?')[0].split('#')[0];
        }
    } catch (error) {
        if (DEBUG) console.warn('Error normalizing URL:', error);
        return url; // Return original if all else fails
    }
};

/**
 * Extract filename from URL to help with matching
 * @param {string} url - URL to extract filename from
 * @returns {string} - Filename or empty string
 */
const extractFilenameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';

    try {
        // Get the last part of the path
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];

        // Remove query parameters
        return lastPart.split('?')[0].split('#')[0];
    } catch (error) {
        if (DEBUG) console.warn('Error extracting filename:', error);
        return '';
    }
};

/**
 * Safely dispatch events to prevent errors
 * @param {string} eventName - Name of the event
 * @param {Object} detail - Event details
 */
const safeDispatchEvent = (eventName, detail) => {
    try {
        window.dispatchEvent(new CustomEvent(eventName, {detail}));
    } catch (error) {
        console.warn(`Error dispatching ${eventName} event:`, error);
    }
};

/**
 * Safe progress handler that won't crash with invalid input
 * @param {number|any} progress - The progress value (0-100)
 */
const safeReportProgress = (progress) => {
    try {
        // Make sure progress is a valid number
        const validProgress = typeof progress === 'number' ? progress : 50;
        const clampedProgress = Math.min(Math.max(0, validProgress), 100);

        // Report progress
        safeDispatchEvent('boat-analysis-status', {
            status: 'analyzing',
            progress: clampedProgress
        });
    } catch (error) {
        console.warn('Error reporting progress:', error);
    }
};

/**
 * Generate a cache key for a user image URL
 * @param {string} url - Image URL
 * @returns {string} - Cache key
 */
const generateCacheKey = (url) => {
    try {
        return safeNormalizeUrl(url);
    } catch (error) {
        if (DEBUG) console.warn('Error generating cache key:', error);
        return url; // Fallback to original URL
    }
};

/**
 * Cleanup function to reset state and timers
 */
const cleanupAnalysis = () => {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    try {
        localStorage.removeItem('analysisProgress');
    } catch (e) {
        if (DEBUG) console.warn('Could not clear localStorage:', e);
    }

    isAnalyzing = false;
    safeDispatchEvent('boat-analysis-status', {
        status: 'complete',
        progress: 100
    });
};

/**
 * Generates a fallback analysis result with basic features
 * @returns {Object} - Fallback analysis result
 */
const generateFallbackResult = () => {
    debugLog('Using fallback result for feature extraction');

    return {
        detectedType: 'Unknown',
        estimatedSize: 'Unknown',
        keyFeatures: ['Boat'],
        style: ['Recreational'],
        confidence: 'low'
    };
};

/**
 * Attempts to download an image and convert it to a File object
 * @param {string} url - The URL of the image
 * @returns {Promise<File|null>} - File object or null if failed
 */
const urlToFile = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Failed to fetch image:', url);
            return null;
        }

        const blob = await response.blob();
        const filename = extractFilenameFromUrl(url) || 'image.jpg';
        return new File([blob], filename, {type: blob.type});
    } catch (error) {
        console.error('Error converting URL to File:', error);
        return null;
    }
};

/**
 * Calculates similarity between two boats based on their features and visual similarity
 * @param {Object} userBoatFeatures - Features extracted from user's boat
 * @param {Object} sampleBoat - Boat from sampleBoats.js to compare against
 * @param {boolean} useVisualSimilarity - Whether to use TensorFlow visual similarity
 * @returns {number} - Similarity score (0-100)
 */
const calculateBoatSimilarity = async (userBoatFeatures, sampleBoat, useVisualSimilarity = true) => {
    if (!userBoatFeatures || !sampleBoat) {
        return 0;
    }

    try {
        let score = 0;
        let maxScore = 0;

        // Visual similarity using TensorFlow (if enabled)
        if (useVisualSimilarity && userBoatFeatures.image && sampleBoat.image) {
            maxScore += 40; // Visual similarity is heavily weighted
            try {
                const visualSimilarity = await compareImages(userBoatFeatures.image, sampleBoat.image);
                console.log(`Visual similarity between boats: ${visualSimilarity}%`);

                // Add the visual similarity score, weighted appropriately
                score += (visualSimilarity / 100) * 40;
            } catch (error) {
                console.error('Error calculating visual similarity:', error);
                // Fall back to traditional similarity if visual comparison fails
                maxScore -= 40;
            }
        }

        // Type match (e.g., "Sport Fishing Express" vs "Express Cruiser")
        if (userBoatFeatures.detectedType && sampleBoat.type) {
            maxScore += 20; // Reduced from 25 to balance with visual similarity
            const userType = userBoatFeatures.detectedType.toLowerCase();
            const sampleType = sampleBoat.type.toLowerCase();

            // Check for partial matches in type
            if (userType === sampleType) {
                score += 20; // Exact match
            } else if (userType.includes(sampleType) || sampleType.includes(userType)) {
                score += 12; // Partial match
            } else {
                // Check for keyword matches
                const typeKeywords = ['cruiser', 'fishing', 'yacht', 'runabout', 'pontoon', 'sailboat', 'speedboat', 'bowrider', 'center console'];
                const userTypeMatches = typeKeywords.filter(keyword => userType.includes(keyword));
                const sampleTypeMatches = typeKeywords.filter(keyword => sampleType.includes(keyword));

                const commonKeywords = userTypeMatches.filter(keyword => sampleTypeMatches.includes(keyword));
                if (commonKeywords.length > 0) {
                    score += 8 * (commonKeywords.length / Math.max(userTypeMatches.length, sampleTypeMatches.length));
                }
            }
        }

        // Size match
        if (userBoatFeatures.estimatedSize && sampleBoat.length) {
            maxScore += 20; // Reduced from 25 to balance with visual similarity
            // Extract numeric values from size strings
            const userSizeMatch = userBoatFeatures.estimatedSize.match(/\d+(\.\d+)?/g);
            if (userSizeMatch && userSizeMatch.length > 0) {
                const userSize = parseFloat(userSizeMatch[0]);
                const sampleSize = parseFloat(sampleBoat.length);

                // Calculate size similarity - closer sizes get higher scores
                const sizeDiff = Math.abs(userSize - sampleSize);
                if (sizeDiff < 2) {
                    score += 20; // Very close match
                } else if (sizeDiff < 5) {
                    score += 16; // Good match
                } else if (sizeDiff < 10) {
                    score += 12; // Fair match
                } else if (sizeDiff < 15) {
                    score += 8; // Poor match
                } else {
                    score += 4; // Very different size
                }
            }
        }

        // Feature match
        if (userBoatFeatures.keyFeatures && userBoatFeatures.keyFeatures.length > 0 &&
            sampleBoat.features && sampleBoat.features.length > 0) {
            maxScore += 10; // Reduced from 30 to balance with visual similarity

            // Normalize features for comparison
            const normalizeFeature = (feature) => feature.toLowerCase().replace(/[^\w\s]/g, '');
            const userFeatures = userBoatFeatures.keyFeatures.map(normalizeFeature);
            const sampleFeatures = sampleBoat.features.map(normalizeFeature);

            // Count feature matches
            let matchCount = 0;
            for (const userFeature of userFeatures) {
                for (const sampleFeature of sampleFeatures) {
                    if (userFeature.includes(sampleFeature) || sampleFeature.includes(userFeature)) {
                        matchCount++;
                        break;
                    }
                }
            }

            // Calculate feature match percentage
            const featureMatchPercentage = matchCount / userFeatures.length;
            score += Math.round(10 * featureMatchPercentage);
        }

        // Style match
        if (userBoatFeatures.style && userBoatFeatures.style.length > 0 && sampleBoat.style) {
            maxScore += 10; // Reduced from 20 to balance with visual similarity

            // Normalize styles
            const userStyle = userBoatFeatures.style.join(' ').toLowerCase();
            const sampleStyle = sampleBoat.style.toLowerCase();

            // Look for style keyword matches
            const styleKeywords = ['luxury', 'sport', 'fishing', 'family', 'cruising', 'performance', 'offshore', 'recreational'];
            let styleScore = 0;

            for (const keyword of styleKeywords) {
                const userHasKeyword = userStyle.includes(keyword);
                const sampleHasKeyword = sampleStyle.includes(keyword);

                if (userHasKeyword && sampleHasKeyword) {
                    styleScore += 2.5; // Both have this keyword
                } else if (userHasKeyword !== sampleHasKeyword) {
                    styleScore -= 1; // Only one has this keyword
                }
            }

            score += Math.max(0, Math.min(10, styleScore));
        }

        // Make sure we have a valid maximum score
        maxScore = Math.max(50, maxScore); // Ensure we have at least some metrics

        // Convert to percentage (0-100)
        const finalScore = Math.round((score / maxScore) * 100);
        return Math.min(99, Math.max(0, finalScore)); // Cap at 99% - only identical boats get 100%

    } catch (error) {
        console.error('Error calculating boat similarity:', error);
        return 50; // Default to middle value on error
    }
};

/**
 * Compares a user's boat (already analyzed) with a sample boat
 * This is done entirely locally, with no additional API calls
 * @param {Object} userBoatFeatures - Features extracted from user's boat
 * @param {Object} sampleBoat - Boat from sampleBoats.js to compare against
 * @returns {Object} - Comparison results including similarity score
 */
export const compareWithSampleBoat = async (userBoatFeatures, sampleBoat) => {
    if (!userBoatFeatures || !sampleBoat) {
        console.warn('Missing user boat features or sample boat for comparison');
        return {
            similarityScore: 0,
            source: 'local_comparison',
            comparisonNotes: ['Insufficient data for comparison'],
            confidence: 'low'
        };
    }

    try {
        // Start preparing results
        const comparisonNotes = [];

        // Ensure userBoatFeatures has the necessary properties
        if (!userBoatFeatures.detectedType) {
            comparisonNotes.push('Missing boat type information');
        }

        if (!userBoatFeatures.estimatedSize) {
            comparisonNotes.push('Missing boat size information');
        }

        if (!userBoatFeatures.keyFeatures || userBoatFeatures.keyFeatures.length === 0) {
            comparisonNotes.push('Missing key feature information');
        }

        // Calculate similarity score using the combined approach (text + visual)
        const similarityScore = await calculateBoatSimilarity(userBoatFeatures, sampleBoat, true);

        // Determine confidence level based on available data
        let confidence = 'medium';

        if (!userBoatFeatures.detectedType || !userBoatFeatures.estimatedSize) {
            confidence = 'low';
        } else if (similarityScore > 80) {
            confidence = 'high';
        }

        // Generate comparison notes
        comparisonNotes.push(`Boat type: ${userBoatFeatures.detectedType || 'Unknown'} vs ${sampleBoat.type || 'Unknown'}`);

        if (userBoatFeatures.estimatedSize && sampleBoat.length) {
            const userSizeMatch = userBoatFeatures.estimatedSize.match(/\d+(\.\d+)?/g);
            if (userSizeMatch && userSizeMatch.length > 0) {
                const userSize = parseFloat(userSizeMatch[0]);
                const sampleSize = parseFloat(sampleBoat.length);
                comparisonNotes.push(`Size: ~${userSize}ft vs ${sampleSize}ft`);
            }
        }

        // Include model name if available
        if (sampleBoat.name) {
            comparisonNotes.push(`Sample boat model: ${sampleBoat.name}`);
        }

        return {
            similarityScore,
            source: 'tensorflow_enhanced',
            comparisonNotes,
            confidence
        };
    } catch (error) {
        console.error('Error comparing boats:', error);
        return {
            similarityScore: 50,
            source: 'error_fallback',
            comparisonNotes: ['Error during comparison', error.message],
            confidence: 'low'
        };
    }
};

/**
 * Analyzes a user's boat image once using GPT-4o
 * This extracts features which can then be compared locally against sampleBoats.js
 * @param {string} userImageUrl - URL of the user's boat image
 * @returns {Promise<Object>} - Analysis results with extracted features
 */
export const analyzeUserBoatImage = async (userImageUrl) => {
    // Validate input
    if (!userImageUrl) {
        console.warn('Missing user image URL for analysis');
        return generateFallbackResult();
    }

    try {
        debugLog('Analyzing user boat image:', userImageUrl.substring(0, 30) + '...');

        // Check cache for previous analysis of this image
        const cacheKey = generateCacheKey(userImageUrl);
        if (analyzedImageCache.has(cacheKey)) {
            const cachedResult = analyzedImageCache.get(cacheKey);
            debugLog('✓ Using cached analysis result for user boat');
            return cachedResult;
        }

        // If we're already analyzing, don't start another analysis
        if (isAnalyzing) {
            debugLog('⚠️ Analysis already in progress, using fallback');
            return generateFallbackResult();
        }

        // Set analysis state
        isAnalyzing = true;

        // Set up progress reporting
        safeDispatchEvent('boat-analysis-status', {
            status: 'analyzing',
            progress: 30
        });

        try {
            safeDispatchEvent('boat-analysis-status', {
                status: 'analyzing',
                progress: 50
            });

            // Create a safer progress callback function for OpenAI
            const safeOnProgress = (progress) => {
                safeReportProgress(progress);
            };

            // Extract features from the user's boat image
            let features;
            try {
                // Convert image URL to File object for OpenAI
                const file = await urlToFile(userImageUrl);

                if (file) {
                    // Call OpenAI with just the user's image
                    features = await openaiAnalyzeBoatImage(file, null, safeOnProgress);
                    console.log('✓ GPT-4o USER BOAT ANALYSIS COMPLETE:', features);
                } else {
                    throw new Error('Failed to convert user image URL to File');
                }
            } catch (error) {
                console.error('Error in OpenAI analysis of user boat:', error);
                features = generateFallbackResult();
            }

            // Cache it for future use
            analyzedImageCache.set(cacheKey, features);

            // Quick update to show progress
            safeDispatchEvent('boat-analysis-status', {
                status: 'complete',
                progress: 100
            });

            // Cleanup
            cleanupAnalysis();

            return features;
        } catch (error) {
            console.error('Error in user boat analysis:', error);
            cleanupAnalysis();
            return generateFallbackResult();
        }
    } catch (error) {
        console.error('Unexpected error in analyzeUserBoatImage:', error);
        cleanupAnalysis();
        return generateFallbackResult();
    }
};

/**
 * This is the legacy function signature for backward compatibility
 * It now calls the new methods internally
 * @param {string} userImageUrl - URL of the user's boat image
 * @param {string} sampleBoatImageUrl - URL of the sample boat image (not used anymore)
 * @returns {Promise<Object>} - Comparison results including similarity score
 */
export const analyzeBoatImage = async (userImageUrl, sampleBoatImageUrl) => {
    // Basic validation
    if (!userImageUrl || !sampleBoatImageUrl) {
        console.warn('Missing image URLs for boat comparison');
        return {
            similarityScore: 0,
            source: 'invalid_input',
            comparisonNotes: ['Missing required image URLs'],
            confidence: 'low'
        };
    }

    // Check if the images are identical (same URL)
    if (userImageUrl === sampleBoatImageUrl) {
        debugLog('Identical images detected - 100% match');
        return {
            similarityScore: 100,
            source: 'identical_images',
            comparisonNotes: ['The boats appear to be identical based on image analysis'],
            confidence: 'high'
        };
    }

    try {
        // Step 1: Analyze the user's boat image to extract features
        debugLog('Analyzing user boat for comparison...');
        const userBoatFeatures = await analyzeUserBoatImage(userImageUrl);

        // Add the image URL to the features for TensorFlow analysis
        userBoatFeatures.image = userImageUrl;

        // Step 2: Create a minimal sample boat object based on the URL
        // We no longer send the sample boat to OpenAI, just use the URL for reference
        debugLog('Using sample boat URL for local comparison...');
        const sampleBoatFeatures = {
            image: sampleBoatImageUrl,
            name: extractFilenameFromUrl(sampleBoatImageUrl),
            features: [],
            type: ''
        };

        // If this is a known sample boat from our database, use that data
        const knownSampleBoat = sampleBoats.find(boat =>
            boat.image === sampleBoatImageUrl ||
            (boat.name && sampleBoatFeatures.name &&
                boat.name.toLowerCase().includes(sampleBoatFeatures.name.toLowerCase())));

        if (knownSampleBoat) {
            debugLog('Found matching sample boat in database:', knownSampleBoat.name);
            Object.assign(sampleBoatFeatures, knownSampleBoat);
        }

        // Step 3: Compare the user's boat with the sample boat
        debugLog('Comparing boats...');
        const result = await compareWithSampleBoat(userBoatFeatures, sampleBoatFeatures);

        // Add source information
        result.source = 'tensorflow_enhanced_analysis';

        debugLog(`Comparison complete: ${result.similarityScore}% match`);
        return result;
    } catch (error) {
        console.error('Error in boat image analysis:', error);

        // If anything fails, return a fallback result with a reasonable score
        return {
            similarityScore: 65,
            source: 'fallback_after_error',
            comparisonNotes: [
                'Error during image analysis comparison',
                'Using estimated similarity score'
            ],
            confidence: 'low'
        };
    }
};
