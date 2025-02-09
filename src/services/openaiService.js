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

    // First, search for similar images using Google Vision
    onProgress?.(20, 'Starting Google Vision analysis...');
    const visionResults = await googleVisionService.searchSimilarImages(base64Image);
    onProgress?.(35, 'Google Vision analysis complete');

    // Extract and format boat information from Vision results
    onProgress?.(40, 'Processing Google Vision results...');
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

    console.log('Making OpenAI API request...', {
      model: 'gpt-4o',
      maxTokens: 500,
      temperature: 0.5,
      messageLength: messages[0].content.length,
      base64Length: formattedBase64.length
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.5
    });

    console.log('OpenAI API raw response:', JSON.stringify(response, null, 2));

    onProgress?.(75, 'Processing OpenAI response...');

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('Invalid OpenAI response structure:', response);
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = response.choices[0].message.content;
    console.log('OpenAI analysis text:', analysis);

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
    const style = styleMatch
      ? styleMatch[1]
          .split(/[,\.]/)
          .map(s => s.trim())
          .filter(s => s && !s.includes('Style Characteristics'))
          .map(s => s.replace(/^\s*-\s*/, '').trim()) // Remove any bullet points and trim
          .filter(s => s) // Remove empty strings
      : [];

    onProgress?.(90, 'Analysis complete');

    return {
      detectedType,
      engineType,
      estimatedSize,
      keyFeatures,
      style
    };

  } catch (error) {
    console.error('Error in analyzeBoatImage:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
}

export async function compareBoats(boat1, boat2) {
  try {
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

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error comparing boats:', error);
    throw error;
  }
}
