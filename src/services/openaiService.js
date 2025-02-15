import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your environment variables.');
}

export async function analyzeBoatImage(file, onProgress) {
  console.group('🚤 Boat Image Analysis');
  try {
    console.log('Starting analysis process...');
    onProgress?.('Identifying boat characteristics...');

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
            text: `Analyze this boat image and provide a detailed classification. Pay special attention to distinguishing between different types of fishing boats. For example:
- Bass Boats: Specialized for bass fishing, featuring raised casting decks, storage for rods, livewells
- Jon Boats: Simple flat-bottom utility boats, typically without raised decks
- Center Console: Fishing boats with the helm in the center
- Sport Fishing: Larger offshore fishing vessels

Format your response as follows:

1. **Detected Boat Type** (be very specific, e.g., "Bass Boat" if you see raised casting decks, pedestal seats, and other bass fishing features)
2. **Engine Type** (describe the visible propulsion system)
3. **Estimated Size** (in feet)
4. **Key Features** (list 3-5 key visible features, focusing on fishing-specific equipment like:
   - Casting decks
   - Rod storage/holders
   - Trolling motors
   - Livewells
   - Navigation electronics)

5. **Style Analysis**:
   First paragraph: Describe the boat's specific purpose and target use case. For example: "This Bass Boat is specifically designed for freshwater fishing, particularly targeting bass and other panfish species. It is optimized for stability and maneuverability in shallow waters, making it ideal for anglers who need to navigate narrow channels and reach secluded fishing spots."

   Key Features of Its Style:
   • Purpose & Use: Focus on specific activities (bass fishing, general fishing, etc.)
   • Design & Layout: How do specific design elements (raised decks, storage, seating) support its primary purpose?
   • Equipment & Accessories: Notable fishing-specific equipment (trolling motors, fish finders, rod holders)
   • Performance Features: Propulsion, handling, and performance characteristics

Look carefully at the design elements that distinguish this type of boat - especially the deck layout, seating arrangement, and specialized fishing equipment.`
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

    console.log('Sending request to OpenAI:', {
      model: 'gpt-4o',
      maxTokens: 800,
      temperature: 0.2,
      messageLength: messages[0].content[0].text.length
    });

    onProgress?.('Identifying boat characteristics...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      temperature: 0.2
    });

    console.log('Received response from OpenAI');

    const analysis = response.choices[0].message.content;
    console.log('Raw analysis:', analysis);
    
    // Extract basic information
    console.group('Extracting Information');
    
    const detectedType = analysis.match(/1\.\s*\*\*Detected Boat Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    console.log('Detected Type:', detectedType);
    
    const engineType = analysis.match(/2\.\s*\*\*Engine Type\*\*:\s*([^\n]+)/)?.[1]?.trim() || 'Not detected';
    console.log('Engine Type:', engineType);
    
    const sizeMatch = analysis.match(/3\.\s*\*\*Estimated Size\*\*:\s*([^\n]+)/)?.[1]?.trim() || '';
    const estimatedSize = sizeMatch.match(/(\d+(?:-\d+)?\s*feet)/i)?.[1] || 'Not detected';
    console.log('Estimated Size:', estimatedSize);

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
    console.log('Key Features:', keyFeatures);

    // Extract style information
    const styleMatch = analysis.match(/5\.\s*\*\*Style Analysis\*\*:\s*([\s\S]*?)(?=\n\n|$)/);
    const styleText = styleMatch ? styleMatch[1] : '';
    console.log('Style Text:', styleText);
    
    // Process style sections
    console.group('Processing Style Sections');
    const styleDetails = [];
    
    // Extract main description
    const mainDescMatch = styleText.match(/^([^•]+)/);
    if (mainDescMatch) {
      const overview = {
        category: 'Overview',
        content: mainDescMatch[1].trim()
      };
      console.log('Overview:', overview);
      styleDetails.push(overview);
    }

    // Extract key features
    const featureMatches = styleText.matchAll(/•\s*([^:]+):\s*([^•]+)/g);
    for (const match of featureMatches) {
      const [_, category, content] = match;
      const feature = {
        category: category.trim(),
        content: content.trim()
      };
      console.log('Style Feature:', feature);
      styleDetails.push(feature);
    }
    console.groupEnd();

    // Extract style tags
    console.group('Processing Style Tags');
    const styleTags = [];
    const lowerText = styleText.toLowerCase();
    
    const tagChecks = [
      { tag: 'Bass', conditions: [() => lowerText.includes('bass'), () => detectedType.toLowerCase().includes('bass')] },
      { tag: 'Fishing', conditions: [() => lowerText.includes('fishing'), () => lowerText.includes('angler')] },
      { tag: 'Family', conditions: [() => lowerText.includes('family')] },
      { tag: 'Recreational', conditions: [() => lowerText.includes('recreational')] },
      { tag: 'Sport', conditions: [() => lowerText.includes('sport')] }
    ];

    tagChecks.forEach(({ tag, conditions }) => {
      if (conditions.some(check => check())) {
        styleTags.push(tag);
        console.log(`Added tag: ${tag}`);
      }
    });
    
    console.log('Final Style Tags:', styleTags);
    console.groupEnd();
    console.groupEnd();

    onProgress?.('Finalizing analysis...');

    const result = {
      detectedType,
      engineType,
      estimatedSize,
      keyFeatures,
      styleTags,
      styleDetails
    };

    console.log('Final Analysis Result:', result);
    console.groupEnd();
    return result;

  } catch (error) {
    console.error('❌ Error in analyzeBoatImage:', error);
    console.groupEnd();
    throw error;
  }
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
