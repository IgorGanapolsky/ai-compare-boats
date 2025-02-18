import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your environment variables.');
}

export const analyzeBoatImage = async (file, onProgress) => {
  try {
    onProgress?.('Starting analysis process...');
    
    // Convert file to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    console.log('Image prepared for OpenAI API');

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this boat image and provide a detailed classification. You MUST select the most specific boat type from the following list that matches the image:

BOAT TYPES (select the most specific match):
- Center Console Cabin Boat
- Center Console
- Express Cruiser
- Sport Fishing
- Sport Fishing Express
- Bowrider
- Jet Boat
- Personal Watercraft

DO NOT create new categories or combine terms. Pick the single most appropriate type from the list above.

Format your response as follows:

1. **Detected Boat Type** (copy exact type from list above)

2. **Engine Type** (describe the visible propulsion system):
   - Configuration (single, twin, triple)
   - Brand if visible
   - Estimated power

3. **Estimated Size** (in feet)

4. **Key Features** (list 3-5 key visible features):
   - Hull and deck configuration
   - Cabin/console layout
   - Navigation/electronics
   - Fishing/sport equipment
   - Safety features

5. **Style Analysis**:
   Describe the boat's:
   - Primary use case
   - Key design elements
   - Target market
   - Notable capabilities

Look carefully at the helm position, cabin design, and overall layout to determine the exact boat type.`
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image
            }
          }
        ]
      }
    ];

    console.log('Sending request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      temperature: 0.2
    });

    const analysis = response.choices[0].message.content;
    console.log('Raw analysis:', analysis);

    // Parse the results
    const results = {
      detectedType: analysis.match(/1\.\s*\*\*Detected Boat Type\*\*:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
      estimatedSize: analysis.match(/3\.\s*\*\*Estimated Size\*\*:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
      keyFeatures: analysis.match(/4\.\s*\*\*Key Features\*\*:?([\s\S]*?)(?=\n\n5\.|$)/)?.[1]
        ?.split('\n')
        ?.map(f => f.replace(/^[- ]*/, ''))
        ?.filter(f => f.trim()),
      styleDetails: analysis.match(/5\.\s*\*\*Style Analysis\*\*:?\s*([\s\S]*?)(?=\n\nKey Features of Its Style:|$)/)?.[1]
        ?.trim()
        ?.replace(/\*\*/g, ''),
      style: extractStyleTags(analysis)
    };

    console.log('Parsed results:', results);
    return results;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

// Update the extractStyleTags function to be more lenient
function extractStyleTags(analysis) {
  const styleSection = analysis.match(/5\.\s*\*\*Style Analysis\*\*:?([\s\S]*?)$/)?.[1] || '';
  if (!styleSection) return [];

  // Extract style-related keywords with more patterns
  const styleWords = styleSection.match(/(?:fishing|recreational|sport|luxury|performance|offshore|inshore|bass|family|commercial|professional|utility|modern|traditional|classic|contemporary|versatile|practical)\b/gi);
  
  if (!styleWords) return [];

  return [...new Set(styleWords)]
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .filter(Boolean);
}

export async function compareBoats(boat1, boat2) {
  try {
    console.group('🚣‍♂️ Boat Comparison');
    console.log('Starting boat comparison...');

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

    console.log('Sending request to OpenAI:', {
      model: 'gpt-4o',
      maxTokens: 500,
      temperature: 0.5,
      messageLength: messages[0].content.length
    });

    console.log('OpenAI: Starting boat comparison');

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.5
      });

      console.log('Received response from OpenAI');

      if (!response.choices?.[0]?.message?.content) {
        console.error('OpenAI: Invalid comparison response');
        throw new Error('Invalid response from OpenAI comparison');
      }

      console.log('OpenAI: Comparison complete');
      const result = response.choices[0].message.content;
      console.log('Comparison Result:', result);
      console.groupEnd();
      return result;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else {
        throw new Error('Failed to compare boats. Please try again.');
      }
    }

  } catch (error) {
    console.error('❌ Error during comparison', error);
    throw error;
  }
}
