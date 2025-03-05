import OpenAI from 'openai';

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Delay between retries (exponential backoff)
const RETRY_DELAY = 1000;

// More specific error types for better handling
export const OPENAI_ERROR_TYPES = {
  CONNECTION_ERROR: 'connection_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  TIMEOUT_ERROR: 'timeout_error',
  AUTH_ERROR: 'authentication_error',
  INVALID_REQUEST: 'invalid_request',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Create a structured error with additional information
 */
const createOpenAIError = (message, type = OPENAI_ERROR_TYPES.UNKNOWN_ERROR, originalError = null) => {
  const error = new Error(message);
  error.type = type;
  error.originalError = originalError;
  return error;
};

/**
 * Analyzes the type of error from OpenAI response
 */
const getErrorType = (error) => {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.response?.status;

  if (message.includes('rate limit') || status === 429) {
    return OPENAI_ERROR_TYPES.RATE_LIMIT_ERROR;
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return OPENAI_ERROR_TYPES.TIMEOUT_ERROR;
  }

  if (message.includes('api key') || message.includes('authentication') || status === 401) {
    return OPENAI_ERROR_TYPES.AUTH_ERROR;
  }

  if (status >= 400 && status < 500) {
    return OPENAI_ERROR_TYPES.INVALID_REQUEST;
  }

  if (status >= 500) {
    return OPENAI_ERROR_TYPES.SERVER_ERROR;
  }

  if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
    return OPENAI_ERROR_TYPES.CONNECTION_ERROR;
  }

  return OPENAI_ERROR_TYPES.UNKNOWN_ERROR;
};

// Create a more robust OpenAI client configuration
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,  // OpenAI's built-in retries
});

// Validate API key on load
if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured. Using fallback analysis mode.');
}

// Helper function to implement retry logic with exponential backoff
const callWithRetry = async (apiFunction, maxRetries = MAX_RETRIES) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error;
      console.warn(`API attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      // Don't retry if it's an authorization error
      if (error.status === 401 || error.status === 403) {
        throw new Error('API authorization failed. Check your API key.');
      }

      // Don't retry if the model is overloaded - just wait longer
      if (error.status === 429 || error.message.includes('overloaded')) {
        console.log('OpenAI API is overloaded, waiting longer before retry');
        await new Promise(r => setTimeout(r, RETRY_DELAY * 3 * (attempt + 1)));
      } else {
        // Standard exponential backoff
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }

  throw createOpenAIError(`API failed after ${maxRetries} attempts: ${lastError.message}`, getErrorType(lastError), lastError);
};

export const analyzeBoatImage = async (file, onProgress) => {
  try {
    // Make sure onProgress is a function, or use a no-op function if it's not
    const progressCallback = typeof onProgress === 'function' ? onProgress : () => { };

    // Safely call progress updates
    const safeProgress = (message) => {
      try {
        progressCallback(message);
      } catch (e) {
        console.warn('Progress callback error:', e);
      }
    };

    safeProgress('Starting analysis process...');

    // Validate API key
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      throw createOpenAIError('Missing API key - using fallback mode', OPENAI_ERROR_TYPES.AUTH_ERROR);
    }

    // Convert file to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    safeProgress('Preparing image for analysis...');
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

    safeProgress('Sending image to AI for analysis...');
    console.log('Sending request to OpenAI');

    // Use the retry function for the API call
    const response = await callWithRetry(() => openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000
    }));

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
    safeProgress(100);
    return results;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw createOpenAIError(`Error analyzing image: ${error.message}`, getErrorType(error), error);
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
      const response = await callWithRetry(() => openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.5
      }));

      console.log('Received response from OpenAI');

      if (!response.choices?.[0]?.message?.content) {
        console.error('OpenAI: Invalid comparison response');
        throw createOpenAIError('Invalid response from OpenAI comparison', OPENAI_ERROR_TYPES.INVALID_REQUEST);
      }

      console.log('OpenAI: Comparison complete');
      const result = response.choices[0].message.content;
      console.log('Comparison Result:', result);
      console.groupEnd();
      return result;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      if (error.response?.status === 401) {
        throw createOpenAIError('Invalid OpenAI API key. Please check your configuration.', OPENAI_ERROR_TYPES.AUTH_ERROR, error);
      } else {
        throw createOpenAIError('Failed to compare boats. Please try again.', getErrorType(error), error);
      }
    }

  } catch (error) {
    console.error('❌ Error during comparison', error);
    throw createOpenAIError(`Error during comparison: ${error.message}`, getErrorType(error), error);
  }
}
