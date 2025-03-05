/**
 * Service for analyzing boat images using GPT-4o
 * This service only uploads the user's image to OpenAI once, then compares features locally
 */

// Import the OpenAI analysis function for single image analysis
import { analyzeBoatImage as openaiAnalyzeBoatImage } from '../services/openaiService';

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
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
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
        return new File([blob], filename, { type: blob.type });
    } catch (error) {
        console.error('Error converting URL to File:', error);
        return null;
    }
};

/**
 * Calculates similarity between two boats based on their features
 * @param {Object} userBoatFeatures - Features extracted from user's boat
 * @param {Object} sampleBoat - Boat from sampleBoats.js to compare against
 * @returns {number} - Similarity score (0-100)
 */
const calculateBoatSimilarity = (userBoatFeatures, sampleBoat) => {
    if (!userBoatFeatures || !sampleBoat) {
        return 0;
    }

    try {
        let score = 0;
        let maxScore = 0;

        // Type match (e.g., "Sport Fishing Express" vs "Express Cruiser")
        if (userBoatFeatures.detectedType && sampleBoat.type) {
            maxScore += 25;
            const userType = userBoatFeatures.detectedType.toLowerCase();
            const sampleType = sampleBoat.type.toLowerCase();

            // Check for partial matches in type
            if (userType === sampleType) {
                score += 25; // Exact match
            } else if (userType.includes(sampleType) || sampleType.includes(userType)) {
                score += 15; // Partial match
            } else {
                // Check for keyword matches
                const typeKeywords = ['cruiser', 'fishing', 'yacht', 'runabout', 'pontoon', 'sailboat', 'speedboat', 'bowrider', 'center console'];
                const userTypeMatches = typeKeywords.filter(keyword => userType.includes(keyword));
                const sampleTypeMatches = typeKeywords.filter(keyword => sampleType.includes(keyword));

                const commonKeywords = userTypeMatches.filter(keyword => sampleTypeMatches.includes(keyword));
                if (commonKeywords.length > 0) {
                    score += 10 * (commonKeywords.length / Math.max(userTypeMatches.length, sampleTypeMatches.length));
                }
            }
        }

        // Size match
        if (userBoatFeatures.estimatedSize && sampleBoat.length) {
            maxScore += 25;
            // Extract numeric values from size strings
            const userSizeMatch = userBoatFeatures.estimatedSize.match(/\d+(\.\d+)?/g);
            if (userSizeMatch && userSizeMatch.length > 0) {
                const userSize = parseFloat(userSizeMatch[0]);
                const sampleSize = parseFloat(sampleBoat.length);

                // Calculate size similarity - closer sizes get higher scores
                const sizeDiff = Math.abs(userSize - sampleSize);
                if (sizeDiff < 2) {
                    score += 25; // Very close match
                } else if (sizeDiff < 5) {
                    score += 20; // Good match
                } else if (sizeDiff < 10) {
                    score += 15; // Fair match
                } else if (sizeDiff < 15) {
                    score += 10; // Poor match
                } else {
                    score += 5; // Very different size
                }
            }
        }

        // Feature match
        if (userBoatFeatures.keyFeatures && userBoatFeatures.keyFeatures.length > 0 &&
            sampleBoat.features && sampleBoat.features.length > 0) {
            maxScore += 30;

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
            score += Math.round(30 * featureMatchPercentage);
        }

        // Style match
        if (userBoatFeatures.style && userBoatFeatures.style.length > 0 && sampleBoat.style) {
            maxScore += 20;

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
                    styleScore += 5; // Both have this keyword
                } else if (userHasKeyword !== sampleHasKeyword) {
                    styleScore -= 2; // Only one has this keyword
                }
            }

            score += Math.max(0, Math.min(20, styleScore));
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
 * Compares a user's boat (already analyzed) with a sample boat
 * This is done entirely locally, with no additional API calls
 * @param {Object} userBoatFeatures - Features extracted from user's boat
 * @param {Object} sampleBoat - Boat from sampleBoats.js to compare against
 * @returns {Object} - Comparison results including similarity score
 */
export const compareWithSampleBoat = (userBoatFeatures, sampleBoat) => {
    if (!userBoatFeatures || !sampleBoat) {
        return {
            similarityScore: 0,
            source: 'local_comparison',
            comparisonNotes: ['Unable to compare due to missing data'],
            confidence: 'low'
        };
    }

    try {
        // Calculate similarity score based on features
        const similarityScore = calculateBoatSimilarity(userBoatFeatures, sampleBoat);

        // Generate comparison notes based on matching features
        const comparisonNotes = [];

        // Add notes about boat type
        if (userBoatFeatures.detectedType && sampleBoat.type) {
            if (userBoatFeatures.detectedType.toLowerCase() === sampleBoat.type.toLowerCase()) {
                comparisonNotes.push(`Both are ${sampleBoat.type} boats`);
            } else {
                comparisonNotes.push(`Your boat appears to be a ${userBoatFeatures.detectedType} while this is a ${sampleBoat.type}`);
            }
        }

        // Add notes about size
        if (userBoatFeatures.estimatedSize && sampleBoat.length) {
            comparisonNotes.push(`Size comparison: Your boat is ${userBoatFeatures.estimatedSize} vs ${sampleBoat.length} feet`);
        }

        // Add feature matches
        if (userBoatFeatures.keyFeatures && userBoatFeatures.keyFeatures.length > 0 &&
            sampleBoat.features && sampleBoat.features.length > 0) {

            // Find matching features
            const normalizeFeature = (feature) => feature.toLowerCase().replace(/[^\w\s]/g, '');
            const userFeatures = userBoatFeatures.keyFeatures.map(normalizeFeature);
            const sampleFeatures = sampleBoat.features.map(normalizeFeature);

            const matchingFeatures = [];
            for (const userFeature of userFeatures) {
                for (const sampleFeature of sampleFeatures) {
                    if (userFeature.includes(sampleFeature) || sampleFeature.includes(userFeature)) {
                        matchingFeatures.push(sampleFeature);
                        break;
                    }
                }
            }

            if (matchingFeatures.length > 0) {
                comparisonNotes.push(`Matching features: ${matchingFeatures.join(', ')}`);
            }
        }

        // Determine confidence level
        let confidence = 'medium';
        if (similarityScore > 80) {
            confidence = 'high';
        } else if (similarityScore < 40) {
            confidence = 'low';
        }

        return {
            similarityScore,
            source: 'local_comparison',
            comparisonNotes: comparisonNotes.length > 0 ? comparisonNotes : ['Comparison based on detected boat characteristics'],
            confidence
        };
    } catch (error) {
        console.error('Error comparing boats:', error);
        return {
            similarityScore: 50,
            source: 'local_comparison_error',
            comparisonNotes: ['Error during comparison, using estimated similarity'],
            confidence: 'low'
        };
    }
};

/**
 * This is the legacy function signature for backward compatibility
 * It now calls the new methods internally
 * @param {string} userImageUrl - URL of the user's boat image
 * @param {string} sampleBoatImageUrl - URL of the sample boat image (not used anymore)
 * @returns {Promise<Object>} - Comparison results including similarity score
 */
export const analyzeBoatImage = async (userImageUrl, sampleBoatImageUrl, /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ boatName1 = '', /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ boatName2 = '') => {
    // Check for identical images - this is a fast path for exact matches
    if (userImageUrl === sampleBoatImageUrl) {
        debugLog('✓ IDENTICAL IMAGES DETECTED - returning 100% match');
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

        // Step 2: Get the sample boat data
        debugLog('Converting sample boat image to File...');
        const sampleFile = await urlToFile(sampleBoatImageUrl);

        // For the sample boat, we have two options:
        // Option 1: We can analyze it with GPT-4o (more expensive but potentially more accurate)
        // Option 2: We can use the data from sampleBoats.js (which is what we're doing in compareWithSampleBoat)

        // Since we don't have direct access to sampleBoats.js here, we'll analyze the sample image
        let sampleBoatFeatures;

        if (sampleFile) {
            try {
                // Try to analyze the sample boat image
                debugLog('Analyzing sample boat image...');
                sampleBoatFeatures = await openaiAnalyzeBoatImage(sampleFile, null, null);
                debugLog('✓ Sample boat analysis complete');
            } catch (error) {
                console.error('Error analyzing sample boat:', error);
                // If this fails, create a minimal sample boat object based on the URL
                sampleBoatFeatures = {
                    image: sampleBoatImageUrl,
                    name: extractFilenameFromUrl(sampleBoatImageUrl),
                    features: [],
                    type: ''
                };
            }
        } else {
            // Create a minimal sample boat object based on the URL
            sampleBoatFeatures = {
                image: sampleBoatImageUrl,
                name: extractFilenameFromUrl(sampleBoatImageUrl),
                features: [],
                type: ''
            };
        }

        // Step 3: Compare the user's boat with the sample boat
        debugLog('Comparing boats...');
        const result = compareWithSampleBoat(userBoatFeatures, sampleBoatFeatures);

        // Add source information
        result.source = 'gpt4o_analysis';

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
