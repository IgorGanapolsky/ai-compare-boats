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

    const prompt = `Analyze this boat image and provide a detailed classification. You MUST be specific about hull material and engine configuration.

1. **Detected Boat Type** (select the most specific match):
   - Center Console Cabin Boat
   - Center Console
   - Express Cruiser
   - Sport Fishing
   - Sport Fishing Express
   - Bowrider
   - Jet Boat
   - Personal Watercraft

2. **Hull Material** (look for specific indicators):
   - Fiberglass (most common, look for gelcoat shine, molded lines)
   - Aluminum (look for welded seams, rivets, metal finish)
   - Wood (rare, look for planking, traditional construction)
   - Composite (carbon fiber, kevlar - look for black/advanced materials)
   Provide confidence level in material identification.

3. **Engine Configuration** (analyze visible indicators):
   - Number of Engines (look for multiple cowlings, exhaust outlets)
   - Engine Type (Outboard/Inboard/I/O - check transom design)
   - Engine Brand if visible (Mercury, Yamaha, Volvo, etc.)
   - Approximate Power Range based on boat size and type
   Be specific about what indicators you see to make this determination.

4. **Estimated Size** (in feet)

5. **Key Features** (list 3-5 key visible features)

6. **Style Analysis**
   Describe primary use case and key design elements.

Look carefully at the transom, hull sides, and overall construction to determine materials and propulsion.`;

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
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
      estimatedSize: analysis.match(/4\.\s*\*\*Estimated Size\*\*:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
      keyFeatures: analysis.match(/5\.\s*\*\*Key Features\*\*:?([\s\S]*?)(?=\n\n6\.|$)/)?.[1]
        ?.split('\n')
        ?.map(f => f.replace(/^[- ]*/, ''))
        ?.filter(f => f.trim()),
      styleDetails: analysis.match(/6\.\s*\*\*Style Analysis\*\*:?\s*([\s\S]*?)(?=\n\nKey Features of Its Style:|$)/)?.[1]
        ?.trim()
        ?.replace(/\*\*/g, ''),
      style: extractStyleTags(analysis),
      hullMaterial: analysis.match(/2\.\s*\*\*Hull Material\*\*:?([\s\S]*?)(?=\n\n3\.|$)/)?.[1]
        ?.split('\n')
        ?.find(line => line.includes('-'))
        ?.replace(/^[- ]*/, '')
        ?.split('(')[0]
        ?.trim(),
      engineConfig: {
        type: analysis.match(/Engine Type:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
        count: analysis.match(/Number of Engines:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
        brand: analysis.match(/Engine Brand:?\s*(.*?)(?=\n|$)/)?.[1]?.trim(),
        power: analysis.match(/Approximate Power:?\s*(.*?)(?=\n|$)/)?.[1]?.trim()
      }
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
  const styleSection = analysis.match(/6\.\s*\*\*Style Analysis\*\*:?([\s\S]*?)$/)?.[1] || '';
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
