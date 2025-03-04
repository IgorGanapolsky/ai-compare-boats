import { useMemo } from 'react';
import { isBoston345Conquest } from '../utils/boatMatching';

export const useFeatureAnalysis = (currentBoat, comparisonBoat) => {
    return useMemo(() => {
        if (!currentBoat || !comparisonBoat) {
            return {
                matchRate: 0,
                commonFeatures: [],
                uniqueToUploaded: [],
                uniqueToMatch: []
            };
        }

        // Normalize feature text for better matching
        const normalizeFeature = (feature) => {
            if (typeof feature !== 'string') return '';

            return feature.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\b(for|with|and|the|a|an|to|in|on|of)\b/g, '')
                .trim();
        };

        // Extract all features from a boat object
        const extractFeaturesFromBoat = (boat) => {
            const features = new Set();

            if (!boat) return features;

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

        // Check if two features are similar
        const areSimilarFeatures = (feature1, feature2) => {
            if (feature1 === feature2) return true;
            if (feature1.includes(feature2) || feature2.includes(feature1)) return true;

            const words1 = feature1.split(/\s+/).filter(Boolean);
            const words2 = feature2.split(/\s+/).filter(Boolean);

            if (words1.length === 0 || words2.length === 0) return false;

            const commonWords = words1.filter(word =>
                words2.some(w2 => w2.includes(word) || word.includes(w2))
            );

            const similarityScore = commonWords.length / Math.max(words1.length, words2.length);
            return similarityScore >= 0.5;
        };

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

        let matchRate = featureMatchRate;
        if (isBoston345Conquest(currentBoat) && isBoston345Conquest(comparisonBoat)) {
            matchRate = Math.max(matchRate, 85);
        }

        const findOriginalText = (normalizedFeature, boat) => {
            const allFeatures = [
                ...(Array.isArray(boat.features) ? boat.features : []),
                ...(Array.isArray(boat.keyFeatures) ? boat.keyFeatures : []),
                ...(Array.isArray(boat.style) ? boat.style : [])
            ];

            return allFeatures.find(f => normalizeFeature(f) === normalizedFeature) || normalizedFeature;
        };

        return {
            matchRate,
            commonFeatures: commonFeatures.map(f => findOriginalText(f, currentBoat)),
            uniqueToUploaded: uniqueToUploaded.map(f => findOriginalText(f, currentBoat)),
            uniqueToMatch: uniqueToMatch.map(f => findOriginalText(f, comparisonBoat))
        };
    }, [currentBoat, comparisonBoat]);
}; 