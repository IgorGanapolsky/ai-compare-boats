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
            text: `Analyze this boat image and provide a detailed classification in the following format:

1. **Detected Boat Type** (e.g., Bass Boat, Pontoon, Sport Fishing, Motor Yacht)
2. **Engine Type** if visible
3. **Estimated Size** in feet
4. **Key Features** (list 3-5 key visible features)
5. **Style Analysis**:
   First paragraph: Describe the boat's classification and primary purpose. For example: "This Bass Boat is specifically designed for freshwater fishing, particularly targeting bass and other panfish species."
   
   Second paragraph: Describe the boat's key design characteristics and how they serve its purpose. For example: "It features a low, sleek profile for easy navigation in shallow waters and provides anglers with ample casting space."
   
   Key Features of Its Style:
   • Purpose & Use: Describe main activities and target user
   • Design & Layout: Describe how the design serves its purpose
   • Performance: Describe propulsion and handling characteristics
   • Capacity & Features: Describe key amenities and capacity
   
   End with ideal conditions and typical use case.

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
      maxTokens: 800,
      temperature: 0.5,
      hasWebResults: !!webResultsText.trim()
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      temperature: 0.5
    });

    onProgress?.(75, 'Processing OpenAI response...');

    const analysis = response.choices[0].message.content;
    
    // Extract basic information
    const detectedType = analysis.match(/1\.\s*\*\*Detected Boat Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    const engineType = analysis.match(/2\.\s*\*\*Engine Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    const sizeMatch = analysis.match(/3\.\s*\*\*Estimated Size\*\*:\s*([^\n]+)/)?.[1]?.trim() || '';
    const estimatedSize = sizeMatch.match(/(\d+(?:-\d+)?\s*feet)/i)?.[1] || 'Not detected';

    // Extract features
    const featuresMatch = analysis.match(/4\.\s*\*\*Key Features\*\*:\s*([\s\S]*?)(?=5\.)/);
    const keyFeatures = featuresMatch
      ? featuresMatch[1]
          .split('\n')
          .map(f => f.trim())
          .filter(f => f && !f.includes('Key Features'))
          .map(f => f.replace(/^\s*[-•]\s*/, '').trim())
          .filter(f => f)
      : [];

    // Extract style information
    const styleMatch = analysis.match(/5\.\s*\*\*Style Analysis\*\*:\s*([\s\S]*?)(?=\n\n|$)/);
    const styleText = styleMatch ? styleMatch[1] : '';
    
    // Process style sections
    const styleDetails = [];
    
    // Extract main paragraphs
    const paragraphs = styleText.split('\n\n').filter(p => p.trim());
    
    if (paragraphs[0]) {
      styleDetails.push({
        category: 'Overview',
        content: paragraphs[0].trim()
      });
    }
    
    if (paragraphs[1]) {
      styleDetails.push({
        category: 'Design Characteristics',
        content: paragraphs[1].trim()
      });
    }

    // Extract key features
    const keyFeaturesMatch = styleText.match(/Key Features of Its Style:([\s\S]*?)(?=End with|$)/i);
    if (keyFeaturesMatch) {
      const features = keyFeaturesMatch[1].trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => {
          const [type, desc] = line.substring(1).split(':').map(s => s.trim());
          if (desc) {
            return { type, desc };
          }
          return null;
        })
        .filter(f => f);
      
      features.forEach(({ type, desc }) => {
        styleDetails.push({
          category: type,
          content: desc
        });
      });
    }

    // Extract conditions and use case
    const conditionsMatch = styleText.match(/(?:End with|This boat is best suited for)[^.]+\./);
    if (conditionsMatch) {
      styleDetails.push({
        category: 'Ideal Conditions',
        content: conditionsMatch[0].replace(/^(?:End with|This boat is best suited for)\s*/, '').trim()
      });
    }

    // Extract style tags
    const styleTags = [];
    const lowerText = styleText.toLowerCase();
    if (lowerText.includes('fishing') || lowerText.includes('angler')) styleTags.push('Fishing');
    if (lowerText.includes('family')) styleTags.push('Family');
    if (lowerText.includes('recreational')) styleTags.push('Recreational');
    if (lowerText.includes('luxury')) styleTags.push('Luxury');
    if (lowerText.includes('performance')) styleTags.push('Performance');
    if (lowerText.includes('sport')) styleTags.push('Sport');
    if (lowerText.includes('offshore')) styleTags.push('Offshore');
    if (lowerText.includes('bass')) styleTags.push('Bass');

    onProgress?.(100, 'Analysis complete');

    return {
      detectedType,
      engineType,
      estimatedSize,
      keyFeatures,
      styleTags,
      styleDetails,
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
      model: "gpt-4o",
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
