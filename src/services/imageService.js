import OpenAI from 'openai';

const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

class ImageService {
  async uploadImage(file) {
    try {
      // Instead of uploading to an external service, we'll use local URL
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error handling image:', error);
      throw error;
    }
  }

  async preprocessImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  revokeImageUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export const imageService = new ImageService();

export async function analyzeImage(imageUrl, prompt) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for development, use backend proxy in production
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 500,
      temperature: 0,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export function isValidImageType(filename) {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return IMAGE_TYPES.includes(extension);
}

export function extractBoatDetails(analysisResult) {
  try {
    // Parse the analysis result to extract structured boat information
    // This will be customized based on the exact format of your GPT-4 Vision responses
    const details = {
      type: '',
      length: '',
      engine: '',
      hullMaterial: '',
      features: []
    };

    // Add logic to parse the GPT-4 Vision response and populate the details object
    // This will depend on how you structure your prompt and the expected response format

    return details;
  } catch (error) {
    console.error('Error extracting boat details:', error);
    throw error;
  }
}
