const searchService = require('../services/searchService');
const aiService = require('../services/aiService');
const cacheService = require('../services/cacheService');
const { validatePriceRequest, validateProductData } = require('../utils/validators');
const { SUPPORTED_COUNTRIES, COUNTRY_MAPPINGS } = require('../utils/constants');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PriceController {
  async getPrices(req, res) {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      logger.info(`[${requestId}] Price request started`, {
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const { country, query } = req.query;
      const validation = validatePriceRequest({ country, query });
      
      if (!validation.isValid) {
        logger.warn(`[${requestId}] Invalid request`, { errors: validation.errors });
        return res.status(400).json({
          error: 'Invalid request parameters',
          details: validation.errors,
          requestId
        });
      }

      if (!SUPPORTED_COUNTRIES.includes(validation.sanitizedData.country)) {
        logger.warn(`[${requestId}] Unsupported country`, { country: validation.sanitizedData.country });
        return res.status(400).json({
          error: 'Unsupported country code',
          details: `Country ${validation.sanitizedData.country} is not supported`,
          requestId
        });
      }

      const cacheKey = `prices:${validation.sanitizedData.country}:${validation.sanitizedData.query}`;
      const cachedResults = cacheService.get(cacheKey);
      
      if (cachedResults) {
        logger.info(`[${requestId}] Cache hit`, { 
          cacheKey,
          resultCount: cachedResults.length,
          responseTime: Date.now() - startTime
        });
        return res.status(200).json({
          results: cachedResults,
          requestId,
          timestamp: new Date().toISOString(),
          currency: COUNTRY_MAPPINGS[validation.sanitizedData.country].currency
        });
      }

      const searchResults = await searchService.searchProducts(validation.sanitizedData.country, validation.sanitizedData.query);
      
      if (!searchResults || searchResults.length === 0) {
        logger.warn(`[${requestId}] No search results found`);
        return res.status(200).json({
          results: [],
          requestId,
          timestamp: new Date().toISOString(),
          currency: COUNTRY_MAPPINGS[validation.sanitizedData.country].currency
        });
      }

      logger.info(`[${requestId}] Processing ${searchResults.length} results with AI`);
      const processedResults = await aiService.extractPriceData(searchResults, validation.sanitizedData.query, validation.sanitizedData.country);

      const filteredResults = processedResults
        .map(result => {
          const productValidation = validateProductData(result);
          if (!productValidation.isValid) {
            logger.warn(`[${requestId}] Skipping invalid product`, {
              product: result.productName,
              errors: productValidation.errors
            });
            return null;
          }
          return result;
        })
        .filter(result => result !== null)
        .sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore; // High relevance first
          }
          return parseFloat(a.price) - parseFloat(b.price); // Low price for equal relevance
        })
        .slice(0, 20);

      cacheService.set(cacheKey, filteredResults, 7200);

      const responseTime = Date.now() - startTime;
      logger.info(`[${requestId}] Request completed successfully`, {
        resultCount: filteredResults.length,
        responseTime,
        cacheKey
      });

      return res.status(200).json({
        results: filteredResults,
        requestId,
        timestamp: new Date().toISOString(),
        currency: COUNTRY_MAPPINGS[validation.sanitizedData.country].currency
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[${requestId}] Request failed`, {
        error: error.message,
        stack: error.stack,
        responseTime
      });

      return res.status(500).json({
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString(),
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
}

module.exports = new PriceController();