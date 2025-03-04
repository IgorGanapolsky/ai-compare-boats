import { useMemo, useCallback } from 'react';

const SIMILARITY_THRESHOLD = 0.5;

export const useFeatureAnalysis = (currentBoat, comparisonBoat) => {
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

        const commonWords = words1.filter(word =>
            words2.some(w2 => w2.includes(word) || word.includes(w2))
        );

        return commonWords.length / Math.max(words1.length, words2.length) >= SIMILARITY_THRESHOLD;
    }, []);

    const findOriginalText = useCallback((normalizedFeature, boat) => {
        const allFeatures = [
            ...(boat.features || []),
            ...(boat.keyFeatures || []),
            ...(boat.style || [])
        ];

        return allFeatures.find(f => normalizeFeature(f) === normalizedFeature) || normalizedFeature;
    }, [normalizeFeature]);

    return useMemo(() => {
        if (!currentBoat || !comparisonBoat) {
            return {
                matchRate: 0,
                commonFeatures: [],
                uniqueToUploaded: [],
                uniqueToMatch: []
            };
        }

        const currentFeatures = extractFeaturesFromBoat(currentBoat);
        const comparisonFeatures = extractFeaturesFromBoat(comparisonBoat);

        const commonFeatures = [...currentFeatures].filter(feature =>
            [...comparisonFeatures].some(compFeature => areSimilarFeatures(feature, compFeature))
        );

        const uniqueToUploaded = [...currentFeatures].filter(feature =>
            ![...comparisonFeatures].some(compFeature => areSimilarFeatures(feature, compFeature))
        );

        const uniqueToMatch = [...comparisonFeatures].filter(feature =>
            ![...currentFeatures].some(currFeature => areSimilarFeatures(feature, currFeature))
        );

        const totalFeatures = commonFeatures.length + uniqueToUploaded.length + uniqueToMatch.length;
        const featureMatchRate = totalFeatures > 0
            ? Math.round((commonFeatures.length / totalFeatures) * 100)
            : 0;

        const matchRate = featureMatchRate;

        return {
            matchRate,
            commonFeatures: commonFeatures.map(f => findOriginalText(f, currentBoat)),
            uniqueToUploaded: uniqueToUploaded.map(f => findOriginalText(f, currentBoat)),
            uniqueToMatch: uniqueToMatch.map(f => findOriginalText(f, comparisonBoat))
        };
    }, [
        currentBoat,
        comparisonBoat,
        extractFeaturesFromBoat,
        areSimilarFeatures,
        findOriginalText
    ]);
}; 