import OpenAI from 'openai';
import { googleVisionService } from './googleVisionService';
import { webContentService } from './webContentService';

const getAnalysisPrompt = (webResults) => `
Analyze this boat image and provide the following details in JSON format. Consider the web search results below when making your analysis.

Pay special attention to the boat's length - look for visual cues like:
- Compare to people or objects in the image
- Look at the number of seats/layout
- Consider the engine size relative to the hull
- Check web results for length information

{
  "type": "Sport Boat/Bowrider/Center Console/etc",
  "manufacturer": "Boat manufacturer if identifiable",
  "model": "Model name/number if identifiable",
  "year": "Estimated year or year range",
  "length": "Length in feet (number only, no units). If exact length is not known, provide best estimate based on visual cues and similar models",
  "engine": "Engine type and configuration if visible (e.g., 'Outboard engine, Yamaha')",
  "hullMaterial": "Hull material and color if visible (e.g., 'White fiberglass with blue accent')",
  "features": [
    "List key visible features like:",
    "- Seating arrangement",
    "- Notable equipment (bimini top, swim platform, etc)",
    "- Cockpit layout",
    "- Navigation equipment",
    "- Other distinctive features"
  ]
}

Web search results:
${webResults}

Focus on visible characteristics and use the web search results to help confirm or identify specifications. If exact measurements aren't available, provide your best estimate based on visual cues and similar models.`;

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development, use backend proxy in production
});

if (!openai.apiKey) {
  throw new Error('OpenAI API key is not set');
}

export async function analyzeBoatImage(base64Image) {
  try {
    // First, search for similar images using Google Vision
    const visionResults = await googleVisionService.searchSimilarImages(base64Image);
    
    // Extract and format boat information from Vision results
    const boatInfos = webContentService.extractBoatInfoFromVisionResults(visionResults);
    const webResultsText = webContentService.formatBoatInfoForPrompt(boatInfos);

    // Format base64 for OpenAI API
    const formattedBase64 = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: getAnalysisPrompt(webResultsText)
            },
            {
              type: "image_url",
              image_url: {
                url: formattedBase64
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    // Extract content from the response
    const content = response.choices[0].message.content;
    
    // Clean up markdown formatting if present
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      // Try parsing as JSON first
      const parsedJson = JSON.parse(jsonStr);
      
      // Remove engine and hull info from features if they're already in top-level fields
      if (parsedJson.features) {
        parsedJson.features = parsedJson.features.filter(feature => 
          !feature.toLowerCase().includes('engine') &&
          !feature.toLowerCase().includes('hull') &&
          feature !== 'List key visible features like:'
        );
      }

      return {
        ...parsedJson,
        webMatches: visionResults.matchingPages.slice(0, 3),
        similarImages: visionResults.similarImages.slice(0, 3),
        isOfflineAnalysis: false
      };
    } catch (e) {
      // If JSON parsing fails, try parsing as text
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      return {
        type: lines.find(l => l.toLowerCase().includes('type:'))?.split(':')[1]?.trim() || 'Unknown',
        manufacturer: lines.find(l => l.toLowerCase().includes('manufacturer:'))?.split(':')[1]?.trim() || 'Unknown',
        model: lines.find(l => l.toLowerCase().includes('model:'))?.split(':')[1]?.trim() || 'Unknown',
        year: lines.find(l => l.toLowerCase().includes('year:'))?.split(':')[1]?.trim() || 'Unknown',
        length: lines.find(l => l.toLowerCase().includes('length:'))?.split(':')[1]?.trim() || 'Not specified',
        engine: lines.find(l => l.toLowerCase().includes('engine:'))?.split(':')[1]?.trim() || 'Unknown',
        hullMaterial: lines.find(l => l.toLowerCase().includes('hull material:'))?.split(':')[1]?.trim() || 'Unknown',
        features: lines.filter(l => l.startsWith('-') || l.startsWith('•')).map(l => l.replace(/^[-•]\s*/, '')),
        webMatches: visionResults.matchingPages.slice(0, 3),
        similarImages: visionResults.similarImages.slice(0, 3),
        isOfflineAnalysis: false
      };
    }
  } catch (error) {
    console.error('Error analyzing boat image:', error);
    throw error;
  }
}

export async function compareBoats(boat1, boat2) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not set');
    }

    const prompt = `
Compare these two boats and provide a similarity analysis:

Boat 1:
${JSON.stringify(boat1, null, 2)}

Boat 2:
${JSON.stringify(boat2, null, 2)}

Analyze and provide:
1. Type Similarity (40% of total score)
2. Length Similarity (30% of total score)
3. Feature Similarity (30% of total score)

Use these scoring rules:
- Type Similarity:
  * Exact match: 40 points
  * Similar category: 30 points
  * Related category: 20 points
  * Different category: 0 points

- Length Similarity:
  * Exact match: 30 points
  * Within 2 feet: 25 points
  * Within 5 feet: 20 points
  * Within 8 feet: 15 points
  * Within 10 feet: 10 points
  * Over 10 feet: 0 points

- Feature Similarity:
  * Calculate percentage of matching features
  * Multiply by 30 to get points

Return the results in a structured format with detailed explanations.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    return parseComparisonResults(response.choices[0].message.content);
  } catch (error) {
    console.error('Error comparing boats:', error);
    throw error;
  }
}

function parseComparisonResults(content) {
  // Initialize scores object
  const scores = {
    typeScore: 0,
    lengthScore: 0,
    featureScore: 0,
    totalScore: 0,
    explanation: {
      type: '',
      length: '',
      features: '',
    }
  };

  try {
    // Parse the content and extract scores and explanations
    const lines = content.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      line = line.trim();

      if (line.includes('Type Similarity:')) {
        currentSection = 'type';
      }
      else if (line.includes('Length Similarity:')) {
        currentSection = 'length';
      }
      else if (line.includes('Feature Similarity:')) {
        currentSection = 'features';
      }
      else if (line.includes('points') || line.includes('score')) {
        const score = parseInt(line.match(/\d+/)?.[0] || '0');

        switch (currentSection) {
          case 'type':
            scores.typeScore = score;
            scores.explanation.type = line;
            break;
          case 'length':
            scores.lengthScore = score;
            scores.explanation.length = line;
            break;
          case 'features':
            scores.featureScore = score;
            scores.explanation.features = line;
            break;
        }
      }
    });

    // Calculate total score
    scores.totalScore = scores.typeScore + scores.lengthScore + scores.featureScore;

    return scores;
  } catch (error) {
    console.error('Error parsing comparison results:', error);
    throw error;
  }
}
