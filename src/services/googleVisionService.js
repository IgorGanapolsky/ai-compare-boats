class GoogleVisionService {
  constructor() {
    if (!process.env.REACT_APP_GOOGLE_CLOUD_API_KEY) {
      throw new Error('Google Cloud API key is not set in environment variables. Please set REACT_APP_GOOGLE_CLOUD_API_KEY in your .env file.');
    }
    this.apiKey = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }

  async searchSimilarImages(base64Image) {
    try {
      if (!base64Image) {
        throw new Error('No image data provided');
      }

      // Remove data URL prefix if present
      const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

      // Validate base64
      try {
        atob(imageData);
      } catch (e) {
        throw new Error('Invalid base64 image data');
      }

      const requestBody = {
        requests: [{
          image: {
            content: imageData
          },
          features: [
            {
              type: 'WEB_DETECTION',
              maxResults: 10
            }
          ]
        }]
      };

      console.log('Making Vision API request...', {
        endpoint: this.apiEndpoint,
        keyLength: this.apiKey.length,
        imageDataLength: imageData.length
      });

      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.text();
      console.log('Vision API raw response:', responseData);

      if (!response.ok) {
        throw new Error(`Google Vision API error (${response.status}): ${responseData}`);
      }

      let result;
      try {
        result = JSON.parse(responseData);
      } catch (e) {
        throw new Error('Invalid JSON response from Vision API');
      }

      if (!result.responses || !result.responses[0]) {
        throw new Error('Empty response from Vision API');
      }

      if (result.responses[0].error) {
        throw new Error(`Vision API error: ${result.responses[0].error.message}`);
      }

      const webDetection = result.responses[0].webDetection || {};

      // Get visually similar images
      const similarImages = webDetection.visuallySimilarImages || [];

      // Get pages with matching images
      const pagesWithImages = webDetection.pagesWithMatchingImages || [];

      // Get best guess labels
      const labels = webDetection.bestGuessLabels || [];

      console.log('Vision API processed results:', {
        similarImagesCount: similarImages.length,
        pagesCount: pagesWithImages.length,
        labelsCount: labels.length
      });

      // Filter for boat-related results
      const boatResults = {
        similarImages: similarImages.filter(img =>
          img.url.toLowerCase().includes('boat') ||
          img.url.toLowerCase().includes('yacht') ||
          img.url.toLowerCase().includes('vessel')
        ),
        matchingPages: pagesWithImages.filter(page =>
          page.url.toLowerCase().includes('boat') ||
          page.url.toLowerCase().includes('yacht') ||
          page.url.toLowerCase().includes('vessel')
        ),
        labels: labels
      };

      // Sort results by relevance
      boatResults.matchingPages.sort((a, b) => (b.score || 0) - (a.score || 0));
      boatResults.similarImages.sort((a, b) => (b.score || 0) - (a.score || 0));

      return boatResults;

    } catch (error) {
      console.error('Error in Google Vision search:', error);
      throw error;
    }
  }
}

export const googleVisionService = new GoogleVisionService();
