const axios = require('axios');
const logger = require('../utils/logger');

class SearchService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.baseUrl = 'https://serpapi.com/search';
    
    if (!this.serpApiKey) {
      throw new Error('SERPAPI_KEY is required');
    }
  }

  async searchProducts(country, query) {
    try {
      logger.info('Searching products with SerpAPI', { country, query });
      
      const results = await this.searchGoogleShopping(country, query);
      
      logger.info(`Found ${results.length} total products from all sources`, { country, query });
      return results;
      
    } catch (error) {
      logger.error('Product search failed', {
        error: error.message,
        country,
        query
      });
      return [];
    }
  }

  async searchGoogleShopping(country, query, retries = 2) {
    try {
      const params = {
        api_key: this.serpApiKey,
        engine: 'google_shopping',
        q: query,
        gl: country.toUpperCase(),
        hl: 'en',
        num: 100,
        safe: 'active',
        device: 'desktop'
      };

      const response = await axios.get(this.baseUrl, { 
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'Universal-Price-Comparison/1.0'
        }
      });

      logger.debug('Raw shopping_results from SerpAPI', { 
        shopping_results: response.data.shopping_results?.slice(0, 5).map(item => ({
          title: item.title,
          price: item.price,
          link: item.link,
          source: item.source
        }))
      });

      if (!response.data || !response.data.shopping_results) {
        logger.warn('No shopping results found in SerpAPI response', { country, query });
        return [];
      }

      const results = response.data.shopping_results
        .filter(item => this.validateShoppingResult(item))
        .map(item => ({
          title: item.title,
          link: item.link || null, // Allow null links for debugging
          price: item.price,
          source: item.source,
          thumbnail: item.thumbnail,
          rating: item.rating,
          reviews: item.reviews,
          delivery: item.delivery,
          serpapi_product_id: item.product_id,
          type: 'shopping'
        }));

      logger.info(`Found ${results.length} shopping results`, { country, query });
      return results;
      
    } catch (error) {
      logger.error('Google Shopping search failed', {
        error: error.message,
        country,
        query,
        status: error.response?.status,
        data: error.response?.data
      });

      if (retries > 0) {
        logger.info(`Retrying search (${retries} attempts left)`, { country, query });
        return this.searchGoogleShopping(country, query, retries - 1);
      }
      return [];
    }
  }

  validateShoppingResult(item) {
    if (!item.title || item.title.length < 3) {
      logger.warn('Skipping result with invalid title', { title: item.title });
      return false;
    }
    if (!item.price) {
      logger.warn('Skipping result with missing price', { title: item.title });
      return false;
    }
    // Log full item for debugging
    logger.debug('Validating shopping result', { item });
    // Temporarily allow missing links for debugging
    return true;
  }
}

module.exports = new SearchService();
