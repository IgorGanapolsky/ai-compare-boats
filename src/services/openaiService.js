import OpenAI from 'openai';
import { googleVisionService } from './googleVisionService';
import { webContentService } from './webContentService';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeBoatImage(base64Image, onProgress) {
  try {
    onProgress?.(10, 'Preparing image analysis...');

    // Get vision results
    const visionResults = await googleVisionService.searchSimilarImages(base64Image, onProgress);

    // Extract and format boat information from Vision results
    const boatInfos = webContentService.extractBoatInfoFromVisionResults(visionResults);
    const webResultsText = webContentService.formatBoatInfoForPrompt(boatInfos);

    // Format base64 for OpenAI API
    const formattedBase64 = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    onProgress?.(50, 'Starting OpenAI analysis...');

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this boat image and provide the following information:
1. Detected boat type (e.g., Pontoon, Sport Fishing, Motor Yacht)
2. Engine type if visible
3. Estimated size
4. Key visible features (list 3-5 key features)
5. Style characteristics (e.g., Luxury, Sport, Family)

Additional context from similar boats:
${webResultsText}`
          },
          {
            type: "image_url",
            image_url: {
              url: formattedBase64
            }
          }
        ]
      }
    ];

    console.log('OpenAI: Starting image analysis', {
      model: 'gpt-4o',
      maxTokens: 500,
      temperature: 0.5,
      hasWebResults: !!webResultsText.trim()
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.5
    });

    onProgress?.(75, 'Processing OpenAI response...');

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('OpenAI: Invalid response structure', response);
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = response.choices[0].message.content;
    console.log('OpenAI: Analysis complete');

    // Parse the analysis text, accounting for markdown formatting
    const detectedType = analysis.match(/1\.\s*\*\*Detected Boat Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    const engineType = analysis.match(/2\.\s*\*\*Engine Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    const sizeMatch = analysis.match(/3\.\s*\*\*Estimated Size\*\*:\s*([^\n]+)/)?.[1]?.trim() || '';
    const estimatedSize = sizeMatch.match(/(\d+(?:-\d+)?\s*feet)/i)?.[1] || 'Not detected';

    // Extract features (items after "4.")
    const featuresMatch = analysis.match(/4\.\s*\*\*Key Visible Features\*\*:\s*([\s\S]*?)(?=5\.)/);
    const keyFeatures = featuresMatch
      ? featuresMatch[1]
          .split('\n')
          .map(f => f.trim())
          .filter(f => f && !f.includes('Key Visible Features'))
          .map(f => f.replace(/^\s*-\s*/, '').trim()) // Remove leading dash and trim
          .filter(f => f) // Remove empty strings
      : [];

    // Extract style (items after "5.")
    const styleMatch = analysis.match(/5\.\s*\*\*Style Characteristics\*\*:\s*([\s\S]*?)(?=\n\n|$)/);
    const styleCharacteristics = styleMatch
      ? styleMatch[1]
          .split('\n')
          .map(s => s.trim())
          .filter(s => s && !s.includes('Style Characteristics'))
          .map(s => s.replace(/^\s*-\s*/, '').trim()) // Remove leading dash and trim
          .filter(s => s) // Remove empty strings
      : [];

    onProgress?.(100, 'Analysis complete');

    return {
      detectedType,
      engineType,
      estimatedSize,
      keyFeatures,
      styleCharacteristics,
      similarBoats: boatInfos
    };

  } catch (error) {
    console.error('OpenAI: Error during analysis', error);
    throw error;
  }
}

export async function compareBoats(boat1, boat2) {
  try {
    const messages = [
      {
        role: "user",
        content: `Compare these two boats and highlight the key differences:

Boat 1:
${JSON.stringify(boat1, null, 2)}

Boat 2:
${JSON.stringify(boat2, null, 2)}

Focus on:
1. Type differences
2. Size comparison
3. Feature differences
4. Style differences
5. Overall recommendation`
      }
    ];

    console.log('OpenAI: Starting boat comparison');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      max_tokens: 500,
      temperature: 0.5
    });

    if (!response.choices?.[0]?.message?.content) {
      console.error('OpenAI: Invalid comparison response');
      throw new Error('Invalid response from OpenAI comparison');
    }

    console.log('OpenAI: Comparison complete');
    return response.choices[0].message.content;

  } catch (error) {
    console.error('OpenAI: Error during comparison', error);
    throw error;
  }
}
