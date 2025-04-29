// Only import what we need
import {useCallback} from 'react';

export const useFeatureAnalysis = () => {
    const normalizeFeature = useCallback((feature) => {
        if (typeof feature !== 'string') return '';

        return feature.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\b(for|with|and|the|a|an|to|in|on|of)\b/g, '')
            .trim();
    }, []);

    const extractFeaturesFromBoat = useCallback((boat) => {
        const features = new Set();

        if (!boat) return features;

        const featureArrays = [
            boat.features || [],
            boat.keyFeatures || [],
            boat.style || []
        ];

        featureArrays.forEach(array => {
            array.forEach(feature => {
                const normalized = normalizeFeature(feature);
                if (normalized) features.add(normalized);
            });
        });

        return features;
    }, [normalizeFeature]);

    const areSimilarFeatures = useCallback((feature1, feature2) => {
        if (feature1 === feature2) return true;
        if (feature1.includes(feature2) || feature2.includes(feature1)) return true;

        const words1 = feature1.split(/\s+/).filter(Boolean);
        const words2 = feature2.split(/\s+/).filter(Boolean);

        if (words1.length === 0 || words2.length === 0) return false;

        // Look for significant words (more than 3 characters) that match
        const commonWords = words1.filter(word =>
            word.length > 3 && words2.some(w2 => w2.includes(word) || word.includes(w2))
        );

        // Lower threshold that matches boatMatching.js logic
        return commonWords.length > 0;
    }, []);

    const findOriginalText = useCallback((normalizedFeature, boat) => {
        const allFeatures = [
            ...(boat.features || []),
            ...(boat.keyFeatures || []),
            ...(boat.style || [])
        ];

        return allFeatures.find(f => normalizeFeature(f) === normalizedFeature) || normalizedFeature;
    }, [normalizeFeature]);

    /**
     * Compares features between two boats and returns similarity metrics
     * @param {Object} boat1 - First boat to compare
     * @param {Object} boat2 - Second boat to compare
     * @returns {Object} Comparison results with common and unique features
     */
    const getFeatureComparison = useCallback((boat1, boat2) => {
        if (!boat1 || !boat2) {
            return {
                commonFeatures: [],
                uniqueToFirst: [],
                uniqueToSecond: [],
                matchRate: 0
            };
        }

        const features1 = Array.from(extractFeaturesFromBoat(boat1));
        const features2 = Array.from(extractFeaturesFromBoat(boat2));

        const commonFeatures = features1.filter(f =>
            features2.some(f2 => areSimilarFeatures(f, f2))
        );

        const uniqueToFirst = features1.filter(f =>
            !features2.some(f2 => areSimilarFeatures(f, f2))
        );

        const uniqueToSecond = features2.filter(f =>
            !features1.some(f2 => areSimilarFeatures(f, f2))
        );

        // Calculate match rate
        let matchRate = 0;
        const totalFeatures = features1.length + features2.length;

        if (totalFeatures > 0) {
            // Count common features twice (once for each boat)
            matchRate = Math.round((commonFeatures.length * 2) / totalFeatures * 100);
        }

        return {
            commonFeatures: commonFeatures.map(f => findOriginalText(f, boat1)),
            uniqueToFirst: uniqueToFirst.map(f => findOriginalText(f, boat1)),
            uniqueToSecond: uniqueToSecond.map(f => findOriginalText(f, boat2)),
            matchRate
        };
    }, [extractFeaturesFromBoat, areSimilarFeatures, findOriginalText]);

    return {
        getFeatureComparison
    };
};
