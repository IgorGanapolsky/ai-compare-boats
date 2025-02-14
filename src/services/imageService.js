import OpenAI from 'openai';

const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

class ImageService {
  async uploadImage(file) {
    try {
      const base64 = await this.fileToBase64(file);
      return {
        base64,
        url: URL.createObjectURL(file)
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async preprocessImage(file) {
    try {
      const base64 = await this.fileToBase64(file);
      return {
        base64,
        url: URL.createObjectURL(file)
      };
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw error;
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
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
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return IMAGE_TYPES.includes(extension);
}

export function extractBoatDetails(analysisResult) {
  try {
    // Remove any markdown code block indicators
    const cleanResult = analysisResult.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanResult);
  } catch (error) {
    console.error('Error parsing analysis result:', error);
    throw new Error('Failed to parse boat details from analysis');
  }
}
