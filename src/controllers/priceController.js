const searchService = require('../services/searchService');
const aiService = require('../services/aiService');
const cacheService = require('../services/cacheService');
const { validatePriceRequest } = require('../utils/validators');
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
          details: validation.errors
        });
      }

      const cacheKey = `prices:${country}:${query}`;
      const cachedResults = cacheService.get(cacheKey);
      
      if (cachedResults) {
        logger.info(`[${requestId}] Cache hit`, { 
          cacheKey,
          resultCount: cachedResults.length,
          responseTime: Date.now() - startTime
        });
        return res.json(cachedResults);
      }

      logger.info(`[${requestId}] Searching for products`, { country, query });
      const searchResults = await searchService.searchProducts(country, query);
      
      if (!searchResults || searchResults.length === 0) {
        logger.warn(`[${requestId}] No search results found`);
        return res.json([]);
      }

      logger.info(`[${requestId}] Processing ${searchResults.length} results with AI`);
      const processedResults = await aiService.extractPriceData(searchResults, query, country);

      logger.debug(`[${requestId}] Processed results`, { processedResults });

      const filteredResults = processedResults
        .filter(result => result && result.price && result.productName)
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 20);

      cacheService.set(cacheKey, filteredResults);

      const responseTime = Date.now() - startTime;
      logger.info(`[${requestId}] Request completed successfully`, {
        resultCount: filteredResults.length,
        responseTime,
        cacheKey
      });

      res.json(filteredResults);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`[${requestId}] Request failed`, {
        error: error.message,
        stack: error.stack,
        responseTime
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
}

module.exports = new PriceController();
