const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { COUNTRY_MAPPINGS, CURRENCY_SYMBOLS } = require('../utils/constants');
const cacheService = require('./cacheService');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.countryMappings = COUNTRY_MAPPINGS;
    this.currencySymbols = CURRENCY_SYMBOLS;
  }

  async extractPriceData(searchResults, originalQuery, country, retries = 2) {
    try {
      logger.info('Extracting price data with Gemini AI', { 
        resultCount: searchResults.length,
        query: originalQuery,
        country
      });

      const cacheKey = `ai:${country}:${originalQuery}`;
      const cachedAIResults = cacheService.get(cacheKey);
      if (cachedAIResults) {
        logger.info('AI cache hit', { cacheKey, resultCount: cachedAIResults.length });
        return cachedAIResults;
      }

      const prompt = this.buildExtractionPrompt(searchResults.slice(0, 20), originalQuery, country);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.debug('Gemini AI raw response', { response: text });
      const processedResults = this.parseAIResponse(text, searchResults, originalQuery, country);
      cacheService.set(cacheKey, processedResults, 7200);
      return processedResults;
      
    } catch (error) {
      logger.error('AI extraction failed', {
        error: error.message,
        query: originalQuery,
        country,
        resultCount: searchResults.length
      });

      if (retries > 0 && (error.message.includes('503') || error.message.includes('429'))) {
        const delay = error.message.includes('429') ? 42000 : 1000;
        logger.info(`Retrying AI extraction (${retries} attempts left)`, { country, query: originalQuery });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.extractPriceData(searchResults, originalQuery, country, retries - 1);
      }

      return this.fallbackExtraction(searchResults, originalQuery, country);
    }
  }

  buildExtractionPrompt(searchResults, originalQuery, country) {
    const resultsText = searchResults.map((result, index) => {
      return `${index + 1}. Title: ${result.title || 'N/A'}
Price: ${result.price || 'N/A'}
Currency: ${result.currency || 'N/A'}
Source: ${result.source || 'N/A'}
Link: ${result.link || 'N/A'}
${result.snippet ? `Description: ${result.snippet}` : ''}
${result.rating ? `Rating: ${result.rating}` : ''}
${result.reviews ? `Reviews: ${result.reviews}` : ''}`;
    }).join('\n\n');

    const expectedCurrency = this.countryMappings[country.toUpperCase()]?.currency || 'USD';

    return `
You are an expert product price extraction system for a universal price comparison tool. Given search results for the query "${originalQuery}" in country "${country}", extract and structure product information.

**CRITICAL INSTRUCTION: ALL PRICES MUST BE IN ${expectedCurrency}.** If a price is found in a different currency, convert it to ${expectedCurrency} using a reasonable exchange rate (e.g., 1 USD = 0.92 EUR, 1 EUR = 89 INR, 1 USD = 5.3 BRL). If conversion is impossible or highly uncertain, set the price to null.

SEARCH RESULTS:
${resultsText}

INSTRUCTIONS:
1. Extract products matching "${originalQuery}" exactly, considering country "${country}".
   - productName: Clean, standardized name (e.g., "Apple MacBook Air M4 256GB")
   - price: Numeric value as a string with two decimal places (e.g., "1299.00" from "A$1,299.00"). Do NOT include currency symbols or commas.
   - currency: This MUST ALWAYS be "${expectedCurrency}".
   - link: The exact product URL from the input, or null if missing. **Do not generate links.**
   - source: Store/website name.
   - thumbnail: Image URL or null.
   - rating: Numeric rating (e.g., 4.5) or null.
   - reviews: Number of reviews (e.g., 1000) or null.
   - delivery: Delivery information string (e.g., "Free delivery") or null.
   - relevanceScore: Match accuracy (0.0 to 1.0, 0.9+ for exact matches).

2. Only include products with a valid price and a valid link.
3. Standardize product names (remove promotional text, keep important specifications like storage, color).
4. Sort the final list by relevanceScore in descending order.
5. Respond ONLY with a valid JSON array.

Example:
[
  {
    "productName": "Apple MacBook Air M4 256GB",
    "price": "1299.00",
    "currency": "AUD",
    "link": "https://apple.com/macbook-air",
    "source": "Apple",
    "thumbnail": "https://serpapi.com/images/123.webp",
    "rating": 4.8,
    "reviews": 1000,
    "delivery": "Free delivery",
    "relevanceScore": 0.95
  }
]

JSON Response:`;
  }

  parseAIResponse(text, originalResults, originalQuery, country) {
    try {
      let cleanText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }
      
      logger.debug('Parsed AI response', { parsedData: parsedData.slice(0, 5) });
      
      return parsedData
        .map(aiItem => {
          const matchingOriginal = originalResults.find(orig => 
            this.cleanProductName(orig.title).includes(this.cleanProductName(aiItem.productName)) ||
            (orig.serpapi_product_id && aiItem.serpapi_product_id && orig.serpapi_product_id === aiItem.serpapi_product_id)
          ) || {};

          return this.validateAndEnhanceProduct(aiItem, matchingOriginal, country);
        })
        .filter(item => item !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error.message,
        responseText: text.substring(0, 500)
      });
      return this.fallbackExtraction(originalResults, originalQuery, country);
    }
  }

  validateAndEnhanceProduct(product, originalResult, country) {
    if (!product.productName || !product.price || !product.link) {
      logger.warn('Skipping invalid product in AI response (missing name, price, or link)', { product });
      return null;
    }
    
    const cleanPrice = this.cleanPrice(product.price);
    if (!cleanPrice) {
      logger.warn('Skipping product with invalid cleaned price', { product });
      return null;
    }
    
    const finalLink = originalResult.link || product.link;
    if (!this.isValidUrl(finalLink)) {
      logger.warn('Skipping product with invalid link', { product, link: finalLink });
      return null;
    }

    return {
      productName: this.cleanProductName(product.productName),
      price: cleanPrice,
      currency: this.determineCurrency(product.currency, originalResult.source, country),
      link: finalLink,
      source: product.source || originalResult.source || 'Unknown',
      thumbnail: product.thumbnail || originalResult.thumbnail || null,
      rating: product.rating || originalResult.rating || null,
      reviews: product.reviews || originalResult.reviews || null,
      delivery: product.delivery || originalResult.delivery || null,
      relevanceScore: this.validateRelevanceScore(product.relevanceScore)
    };
  }

  cleanPrice(price) {
    if (!price) return null;
    const cleanPrice = price.toString().replace(/[^0-9.]/g, '');
    const numericPrice = parseFloat(cleanPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) return null;
    return numericPrice.toFixed(2); // Return as string with 2 decimal places
  }

  cleanProductName(name) {
    if (!name) return '';
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-().,]/g, '')
      .replace(/\b(sale|discount|free shipping|offer|deal|special|refurbished|used)\b/gi, '')
      .trim()
      .substring(0, 200);
  }

  determineCurrency(aiExtractedCurrency, source, country) {
    const countryInfo = this.countryMappings[country.toUpperCase()];
    if (countryInfo && countryInfo.currency) {
      return countryInfo.currency;
    }
    return 'USD';
  }

  validateRelevanceScore(score) {
    if (typeof score === 'number' && score >= 0 && score <= 1) {
      return score;
    }
    return 0.5;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  fallbackExtraction(searchResults, originalQuery, country) {
    logger.info('Using fallback extraction method');
    return searchResults
      .map(result => {
        if (!result.title || !result.price || !result.link) {
          logger.warn('Skipping result in fallback extraction (missing title, price, or link)', { 
            title: result.title,
            price: result.price,
            link: result.link
          });
          return null;
        }
        const cleanPrice = this.cleanPrice(result.price);
        if (!cleanPrice) {
          logger.warn('Skipping result with invalid price in fallback', { result });
          return null;
        }

        if (!this.isValidUrl(result.link)) {
          logger.warn('Skipping result with invalid link in fallback', { result });
          return null;
        }

        return {
          productName: this.cleanProductName(result.title),
          price: cleanPrice,
          currency: this.determineCurrency(result.currency, result.source, country),
          link: result.link,
          source: result.source || 'Unknown',
          thumbnail: result.thumbnail || null,
          rating: result.rating || null,
          reviews: result.reviews || null,
          delivery: result.delivery || null,
          relevanceScore: this.calculateBasicRelevance(result.title, originalQuery)
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  calculateBasicRelevance(title, query) {
    if (!title || !query) return 0.5;
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    let matchCount = 0;
    let exactMatch = titleLower.includes(queryLower);
    queryWords.forEach(word => {
      if (titleLower.includes(word)) {
        matchCount++;
      }
    });
    let relevance = matchCount / queryWords.length;
    if (exactMatch) {
      relevance = Math.min(relevance + 0.3, 1.0);
    }
    return Math.max(0.5, Math.min(relevance, 1.0));
  }
}

module.exports = new AIService();