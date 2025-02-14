class GoogleVisionService {
  constructor() {
    if (!process.env.REACT_APP_GOOGLE_CLOUD_API_KEY) {
      throw new Error('Google Cloud API key is not set in environment variables. Please set REACT_APP_GOOGLE_CLOUD_API_KEY in your .env file.');
    }
    this.apiKey = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }

  async searchSimilarImages(base64Image, onProgress) {
    try {
      onProgress?.(0, 'Starting Google Vision analysis...');
      
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

      console.log('Google Vision: Initiating API request', {
        endpoint: this.apiEndpoint,
        requestSize: Math.round(imageData.length / 1024) + 'KB'
      });

      onProgress?.(20, 'Sending request to Google Vision...');

      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Vision: API request failed', {
          status: response.status,
          error: errorData
        });
        throw new Error(`Vision API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.responses?.[0]) {
        console.error('Google Vision: Empty response received');
        throw new Error('Empty response from Vision API');
      }

      const webDetection = data.responses[0].webDetection;
      
      if (!webDetection) {
        console.error('Google Vision: No web detection results');
        throw new Error('No web detection results found');
      }

      console.log('Google Vision: Analysis complete', {
        bestGuessLabels: webDetection.bestGuessLabels?.length || 0,
        webEntities: webDetection.webEntities?.length || 0,
        visuallySimilarImages: webDetection.visuallySimilarImages?.length || 0
      });

      onProgress?.(40, 'Processing Google Vision results...');

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
      console.error('Google Vision: Error during analysis', error);
      throw error;
    }
  }
}

export const googleVisionService = new GoogleVisionService();
