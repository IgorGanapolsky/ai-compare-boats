import { fetch } from 'node-fetch';

class WebContentService {
  async fetchAndExtractBoatInfo(urls) {
    const boatInfos = [];
    
    for (const url of urls) {
      try {
        // Skip non-http URLs
        if (!url.startsWith('http')) continue;

        const response = await fetch(url);
        if (!response.ok) continue;
        
        const content = await response.text();
        
        // Extract boat-related information from the content
        const boatInfo = this.extractBoatInfo(content, url);
        if (boatInfo) {
          boatInfos.push(boatInfo);
        }
      } catch (error) {
        console.error(`Error fetching content from ${url}:`, error);
      }
    }

    return boatInfos;
  }

  extractBoatInfo(content, url) {
    // Remove HTML tags and normalize whitespace
    const text = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Look for boat-related information
    const info = {
      url,
      specs: [],
      description: ''
    };

    // Extract specifications
    const specPatterns = [
      /Length:\s*([\d.]+)\s*(?:feet|ft)/i,
      /(\d{4})\s*(?:model|year)/i,
      /(?:powered by|engine|motor):\s*([^.]+)/i,
      /(?:manufacturer|make|brand):\s*([^.]+)/i,
      /(?:model|series):\s*([^.]+)/i,
      /hull:\s*([^.]+)/i
    ];

    specPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        info.specs.push(`${match[0]}`);
      }
    });

    // Extract a relevant description (look for sentences containing boat-related terms)
    const sentences = text.split(/[.!?]+/);
    const boatTerms = ['boat', 'yacht', 'vessel', 'craft', 'bowrider', 'cruiser'];
    
    const relevantSentences = sentences
      .filter(sentence => 
        boatTerms.some(term => sentence.toLowerCase().includes(term))
      )
      .slice(0, 3); // Take up to 3 relevant sentences

    info.description = relevantSentences.join('. ').trim();

    // Only return if we found some useful information
    return info.specs.length > 0 || info.description ? info : null;
  }

  extractBoatInfoFromVisionResults(visionResults) {
    console.log('Raw Vision Results:', JSON.stringify(visionResults, null, 2));
    
    const boatInfos = [];
    
    // Extract model info from page titles first
    const modelPattern = /(\d{4})\s+([\w-]+)\s+(\d{2,3}(?:\.\d)?)\s*(?:lr|cs|bowrider|ft)/i;
    const modelInfos = new Set();
    
    if (visionResults.pagesWithMatchingImages) {
      visionResults.pagesWithMatchingImages.forEach(page => {
        if (page.pageTitle) {
          const modelMatch = page.pageTitle.match(modelPattern);
          if (modelMatch) {
            modelInfos.add({
              type: 'Model',
              year: modelMatch[1],
              manufacturer: modelMatch[2],
              length: modelMatch[3],
              content: `${modelMatch[1]} ${modelMatch[2]} ${modelMatch[3]}'`
            });
          }
        }
      });
    }
    
    // Add model infos first as they're most reliable
    boatInfos.push(...modelInfos);
    
    if (visionResults.bestGuessLabels) {
      boatInfos.push({
        type: 'Label',
        content: visionResults.bestGuessLabels.map(label => label.label).join(', ')
      });
    }

    if (visionResults.webEntities) {
      const relevantEntities = visionResults.webEntities
        .filter(entity => 
          entity.description.toLowerCase().includes('boat') ||
          entity.description.toLowerCase().includes('yacht') ||
          entity.description.toLowerCase().includes('vessel') ||
          entity.description.toLowerCase().includes('stingray') ||
          /\d{2}(?:\s*(?:ft|feet|\'|\"))/.test(entity.description)
        )
        .map(entity => ({
          type: 'Entity',
          content: entity.description,
          score: entity.score
        }));
      
      boatInfos.push(...relevantEntities);
    }

    if (visionResults.pagesWithMatchingImages) {
      const pageInfos = visionResults.pagesWithMatchingImages
        .slice(0, 5)
        .map(page => ({
          type: 'Page',
          url: page.url,
          title: page.pageTitle || '',
          snippet: page.partialMatchingImages?.[0]?.pageTitle || ''
        }))
        .filter(info => {
          const text = (info.title + ' ' + info.snippet).toLowerCase();
          return text.includes('boat') || 
                 text.includes('yacht') || 
                 text.includes('vessel') ||
                 text.includes('stingray') ||
                 /\d{2}(?:\s*(?:ft|feet|\'|\"))/.test(text);
        });

      boatInfos.push(...pageInfos);
    }

    console.log('Extracted Boat Info:', JSON.stringify(boatInfos, null, 2));
    return boatInfos;
  }

  formatBoatInfoForPrompt(boatInfos) {
    const sections = [];

    // Format model information first
    const modelInfos = boatInfos
      .filter(info => info.type === 'Model')
      .map(info => `${info.content} (${info.manufacturer} ${info.length}' model from ${info.year})`);
    if (modelInfos.length > 0) {
      sections.push(`Model Information: ${modelInfos.join(', ')}`);
    }

    // Format labels
    const labels = boatInfos
      .filter(info => info.type === 'Label')
      .map(info => info.content);
    if (labels.length > 0) {
      sections.push(`Identified as: ${labels.join(', ')}`);
    }

    // Format entities
    const entities = boatInfos
      .filter(info => info.type === 'Entity')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map(info => info.content);
    if (entities.length > 0) {
      sections.push(`Related information: ${entities.join(', ')}`);
    }

    // Format pages
    const pages = boatInfos
      .filter(info => info.type === 'Page')
      .map(info => {
        const parts = [];
        if (info.title) parts.push(`Title: ${info.title}`);
        if (info.snippet) parts.push(`Description: ${info.snippet}`);
        if (parts.length === 0) return null;
        
        return `Source: ${info.url}\n${parts.join('\n')}`;
      })
      .filter(Boolean);
    
    if (pages.length > 0) {
      sections.push('Similar boats found:\n' + pages.join('\n\n'));
    }

    const formattedText = sections.join('\n\n');
    console.log('Formatted Prompt Info:', formattedText);
    return formattedText;
  }
}

export const webContentService = new WebContentService();
