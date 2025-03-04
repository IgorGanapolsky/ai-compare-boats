/**
 * Service for analyzing boat images using GPT-4o
 */

// API configuration
const API_ENDPOINT = process.env.REACT_APP_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/**
 * Analyzes two boat images and returns a similarity assessment
 * @param {string} imageUrl1 - URL of the first boat image
 * @param {string} imageUrl2 - URL of the second boat image
 * @returns {Promise<Object>} - Analysis results including similarity score and details
 */
export const analyzeBoatImage = async (imageUrl1, imageUrl2) => {
    if (!API_KEY) {
        console.error('OpenAI API key is not configured');
        throw new Error('API key is not configured');
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in boat analysis. Compare the two boat images and provide a detailed comparison of their similarities and differences, focusing on boat type, structure, features, and overall appearance.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Compare these two boat images and calculate a similarity score from 0-100. Provide detailed analysis of similarities and differences in boat type, structure, size, features, and overall appearance.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl1,
                                }
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl2,
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const analysisText = data.choices[0].message.content;

        // Extract similarity score from response
        const scoreMatch = analysisText.match(/(\d+)(?:\s*\/\s*100|%)/);
        const similarityScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 50; // Default to 50 if can't extract

        // Extract key insights from the analysis
        const insights = extractInsights(analysisText);

        return {
            similarityScore,
            insights,
            fullAnalysis: analysisText,
        };
    } catch (error) {
        console.error('Error analyzing boat images:', error);
        throw error;
    }
};

/**
 * Extracts key insights from the analysis text
 * @param {string} analysisText - Full analysis text from GPT-4o
 * @returns {Object} - Structured insights
 */
const extractInsights = (analysisText) => {
    const insights = {
        similarities: [],
        differences: [],
        boatType: { match: false, details: '' },
        size: { match: false, details: '' },
        features: { match: false, details: '' },
    };

    // Extract similarities section
    const similaritiesMatch = analysisText.match(/similarities:?(.*?)(?=differences:|$)/is);
    if (similaritiesMatch && similaritiesMatch[1]) {
        const similaritiesText = similaritiesMatch[1].trim();
        insights.similarities = similaritiesText
            .split(/\n|\./)
            .map(item => item.trim())
            .filter(item => item.length > 10); // Filter out short or empty items
    }

    // Extract differences section
    const differencesMatch = analysisText.match(/differences:?(.*?)(?=conclusion:|$)/is);
    if (differencesMatch && differencesMatch[1]) {
        const differencesText = differencesMatch[1].trim();
        insights.differences = differencesText
            .split(/\n|\./)
            .map(item => item.trim())
            .filter(item => item.length > 10);
    }

    // Extract boat type match
    if (/same\s+(type|category|class)/i.test(analysisText)) {
        insights.boatType.match = true;

        // Try to extract the boat type
        const typeMatch = analysisText.match(/both\s+(?:are|appear\s+to\s+be)\s+([^,.]+)/i);
        if (typeMatch) {
            insights.boatType.details = typeMatch[1].trim();
        }
    }

    // Extract size match
    if (/similar\s+(size|length|dimensions)/i.test(analysisText)) {
        insights.size.match = true;

        // Try to extract size details
        const sizeMatch = analysisText.match(/(\d+\s*(?:feet|ft|foot|meter|m))/i);
        if (sizeMatch) {
            insights.size.details = sizeMatch[1];
        }
    }

    // Extract features match
    const featureMatchRatio = (insights.similarities.length) /
        (insights.similarities.length + insights.differences.length);

    insights.features.match = featureMatchRatio > 0.6; // If more than 60% are similar
    insights.features.details = `${Math.round(featureMatchRatio * 100)}% feature match`;

    return insights;
}; 