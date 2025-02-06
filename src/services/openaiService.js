import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // Required for client-side usage
});

const SYSTEM_PROMPT = `You are a boat analysis expert. Analyze the image and extract the following information:
1. Boat type (e.g., Sailboat, Motor Yacht, Center Console, etc.)
2. Approximate length
3. Key features visible in the image
4. Hull material if visible
5. Hull color
6. Engine type if visible
7. Any notable equipment or accessories

Format your response as a JSON object with the following structure:
{
  "type": "string",
  "length": number,
  "hullMaterial": "string",
  "hullColor": "string",
  "engine": "string",
  "features": ["string"]
}`;

export async function analyzeBoatImage(base64Image) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "Analyze this boat image and provide details about its features, specifications, and characteristics."
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    // Parse the response to get structured data
    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
}
