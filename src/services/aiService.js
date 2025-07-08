const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { CURRENCY_MAP } = require('../utils/constants');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractPriceData(searchResults, originalQuery, country) {
    try {
      logger.info('Extracting price data with Gemini AI', { 
        resultCount: searchResults.length,
        query: originalQuery,
        country
      });

      const prompt = this.buildExtractionPrompt(searchResults, originalQuery, country);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.debug('Gemini AI raw response', { response: text });
      return this.parseAIResponse(text, searchResults, originalQuery, country);
      
    } catch (error) {
      logger.error('AI extraction failed', {
        error: error.message,
        query: originalQuery,
        country,
        resultCount: searchResults.length
      });
      return this.fallbackExtraction(searchResults, originalQuery, country);
    }
  }

  buildExtractionPrompt(searchResults, originalQuery, country) {
    const resultsText = searchResults.map((result, index) => {
      return `${index + 1}. Title: ${result.title || 'N/A'}
Price: ${result.price || 'N/A'}
Source: ${result.source || 'N/A'}
Link: ${result.link || 'N/A'}
${result.snippet ? `Description: ${result.snippet}` : ''}
${result.rating ? `Rating: ${result.rating}` : ''}
${result.reviews ? `Reviews: ${result.reviews}` : ''}`;
    }).join('\n\n');

    return `
You are an expert product price extraction system for a universal price comparison tool. Given search results for the query "${originalQuery}" in country "${country}", extract and structure product information.

SEARCH RESULTS:
${resultsText}

INSTRUCTIONS:
1. Extract products matching "${originalQuery}" exactly, considering country "${country}":
   - productName: Clean, standardized name (e.g., "Apple iPhone 16 128GB")
   - price: Numeric value only (e.g., "79900" from "₹79,900")
   - currency: Use country-specific currency (e.g., INR for India)
   - link: Exact product URL from input, or null if missing
   - source: Store/website name
   - thumbnail: Image URL or null
   - rating: Numeric rating or null
   - reviews: Number of reviews or null
   - delivery: Delivery info or null
   - relevanceScore: Match accuracy (0.0 to 1.0, 0.9+ for exact matches)
2. Include products with valid price, even if link is missing
3. Standardize product names (remove promotional text, keep specs like storage, color)
4. Use country to determine currency (e.g., INR for IN, USD for US)
5. Preserve exact link from input, or set to null if missing
6. Sort by relevanceScore descending
7. Respond ONLY with a valid JSON array

Example:
[
  {
    "productName": "Apple iPhone 16 128GB",
    "price": "79900",
    "currency": "INR",
    "link": "https://flipkart.com/iphone-16",
    "source": "Flipkart",
    "thumbnail": "https://serpapi.com/images/123.webp",
    "rating": 4.8,
    "reviews": 10000,
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
        .map((item, index) => {
          const original = originalResults[index] || {};
          return this.validateAndEnhanceProduct(item, original, country);
        })
        .filter(item => item !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error.message,
        responseText: text
      });
      return this.fallbackExtraction(originalResults, originalQuery, country);
    }
  }

  validateAndEnhanceProduct(product, originalResult, country) {
    if (!product.productName || !product.price) {
      logger.warn('Skipping invalid product in AI response', { product });
      return null;
    }
    
    const cleanPrice = this.cleanPrice(product.price);
    if (!cleanPrice) {
      logger.warn('Skipping product with invalid price', { product });
      return null;
    }
    
    return {
      productName: this.cleanProductName(product.productName),
      price: cleanPrice,
      currency: this.determineCurrency(product.currency, originalResult.source, country),
      link: originalResult.link || null,
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
    const cleanPrice = price.toString().replace(/[^\d.]/g, '').replace(/\.+/g, '.');
    const numericPrice = parseFloat(cleanPrice);
    return isNaN(numericPrice) || numericPrice <= 0 ? null : numericPrice.toString();
  }

  cleanProductName(name) {
    if (!name) return '';
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-()]/g, '')
      .replace(/\b(sale|discount|free shipping|offer|deal|special)\b/gi, '')
      .trim()
      .substring(0, 200);
  }

  determineCurrency(currency, source, country) {
    if (currency && typeof currency === 'string' && /^[A-Z]{3}$/.test(currency.toUpperCase())) {
      return currency.toUpperCase();
    }
    if (country && CURRENCY_MAP[country.toUpperCase()]) {
      return CURRENCY_MAP[country.toUpperCase()];
    }
    return 'USD';
  }

  validateRelevanceScore(score) {
    if (typeof score === 'number' && score >= 0 && score <= 1) {
      return score;
    }
    return 0.5;
  }

  fallbackExtraction(searchResults, originalQuery, country) {
    logger.info('Using fallback extraction method');
    return searchResults
      .map(result => {
        if (!result.title || !result.price) {
          logger.warn('Skipping result in fallback extraction', { 
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
        return {
          productName: this.cleanProductName(result.title),
          price: cleanPrice,
          currency: this.determineCurrency(null, result.source, country),
          link: result.link || null,
          source: result.source || 'Unknown',
          thumbnail: result.thumbnail || null,
          rating: result.rating || null,
          reviews: result.reviews || null,
          delivery: result.delivery || null,
          relevanceScore: this.calculateBasicRelevance(result.title, originalQuery)
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
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
