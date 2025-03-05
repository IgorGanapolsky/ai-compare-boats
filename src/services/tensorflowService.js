import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Initialize variables to store models
let mobileNetModel = null;
const modelLoading = { isLoading: false };
let modelLoadPromise = null;

// Cache for image features to avoid reprocessing
const imageFeatureCache = new Map();

/**
 * Loads the MobileNet model for feature extraction
 * @returns {Promise<mobilenet.MobileNet>} - The loaded MobileNet model
 */
export const loadModel = async () => {
    console.log('TensorFlow backend:', tf.getBackend());
    
    if (mobileNetModel) {
        return mobileNetModel;
    }

    if (modelLoadPromise) {
        return modelLoadPromise;
    }

    try {
        modelLoading.isLoading = true;
        // Create a promise that can be reused if multiple calls happen during loading
        modelLoadPromise = mobilenet.load({
            version: 2,
            alpha: 1.0
        });

        mobileNetModel = await modelLoadPromise;
        console.log('✓ MobileNet model loaded successfully');
        return mobileNetModel;
    } catch (error) {
        console.error('Error loading MobileNet model:', error);
        modelLoadPromise = null;
        throw error;
    } finally {
        modelLoading.isLoading = false;
    }
};

/**
 * Converts an image URL to an HTML Image element
 * @param {string} url - The URL of the image
 * @returns {Promise<HTMLImageElement>} - The loaded image element
 */
export const urlToImage = async (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS issues
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
        img.src = url;
    });
};

/**
 * Extracts features from an image using MobileNet
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<Float32Array>} - Feature vector for the image
 */
export const extractImageFeatures = async (imageUrl) => {
    // Check cache first
    if (imageFeatureCache.has(imageUrl)) {
        return imageFeatureCache.get(imageUrl);
    }

    try {
        // Load the model if not already loaded
        const model = await loadModel();

        // Load the image
        const img = await urlToImage(imageUrl);

        // Get the intermediate activation from MobileNet
        // Use the logits of the second-to-last layer for feature embedding
        const activation = model.infer(img, true);

        // Convert to a float32 array for easier comparison
        const features = await activation.data();

        // Store in cache
        imageFeatureCache.set(imageUrl, features);

        return features;
    } catch (error) {
        console.error('Error extracting image features:', error);
        throw error;
    }
};

/**
 * Calculates cosine similarity between two feature vectors
 * @param {Float32Array} features1 - First feature vector
 * @param {Float32Array} features2 - Second feature vector
 * @returns {number} - Similarity score from 0 to 1
 */
export const calculateCosineSimilarity = (features1, features2) => {
    if (!features1 || !features2 || features1.length !== features2.length) {
        return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < features1.length; i++) {
        dotProduct += features1[i] * features2[i];
        magnitude1 += features1[i] * features1[i];
        magnitude2 += features2[i] * features2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Compares two images and returns a similarity score
 * @param {string} imageUrl1 - URL of the first image
 * @param {string} imageUrl2 - URL of the second image
 * @returns {Promise<number>} - Similarity score from 0 to 100
 */
export const compareImages = async (imageUrl1, imageUrl2) => {
    try {
        // Extract features from both images
        const features1 = await extractImageFeatures(imageUrl1);
        const features2 = await extractImageFeatures(imageUrl2);

        // Calculate similarity
        const similarity = calculateCosineSimilarity(features1, features2);

        // Convert to percentage (0-100)
        return Math.round(similarity * 100);
    } catch (error) {
        console.error('Error comparing images:', error);
        return 50; // Default to middle value on error
    }
};

/**
 * Calculates the distance between two feature vectors
 * @param {Float32Array} features1 - First feature vector
 * @param {Float32Array} features2 - Second feature vector
 * @returns {number} - Euclidean distance between the vectors
 */
export const calculateEuclideanDistance = (features1, features2) => {
    if (!features1 || !features2 || features1.length !== features2.length) {
        return Number.MAX_VALUE;
    }

    let sumSquaredDifferences = 0;

    for (let i = 0; i < features1.length; i++) {
        const diff = features1[i] - features2[i];
        sumSquaredDifferences += diff * diff;
    }

    return Math.sqrt(sumSquaredDifferences);
};

/**
 * Normalizes a score to a 0-100 range based on a maximum possible distance
 * @param {number} distance - Euclidean distance between feature vectors
 * @returns {number} - Normalized similarity score (0-100)
 */
export const normalizeScore = (distance) => {
    // Maximum reasonable distance based on experiments with the model
    const MAX_DISTANCE = 2.0;

    // Invert the distance and normalize to 0-100
    const normalizedScore = Math.max(0, 100 * (1 - (distance / MAX_DISTANCE)));

    return Math.min(99, Math.round(normalizedScore)); // Cap at 99% - only identical boats get 100%
};

/**
 * Clear the feature cache to free memory
 */
export const clearFeatureCache = () => {
    imageFeatureCache.clear();
};
