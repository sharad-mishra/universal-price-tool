const axios = require('axios');
const logger = require('../utils/logger');
const { COUNTRY_MAPPINGS } = require('../utils/constants');

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
      const countryCode = country.toUpperCase();
      const languageCode = COUNTRY_MAPPINGS[countryCode]?.language || 'en';

      const params = {
        api_key: this.serpApiKey,
        engine: 'google_shopping',
        q: query,
        gl: countryCode,
        hl: languageCode,
        num: 100,
        safe: 'active',
        device: 'desktop'
      };

      const response = await axios.get(this.baseUrl, { 
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'UniversalPriceComparisonTool/1.0 (+http://your-app-url.com)'
        }
      });

      if (response.data.error) {
        throw new Error(`SerpAPI Error: ${response.data.error}`);
      }

      if (response.data.shopping_results) {
        const results = response.data.shopping_results
          .filter(this.validateShoppingResult)
          .map(item => {
            const productLink = item.product_link || item.offer_link || item.link || null;

            return {
              title: item.title,
              link: productLink,
              price: item.price,
              currency: item.price_currency || null,
              source: item.source,
              thumbnail: item.thumbnail,
              rating: item.rating,
              reviews: item.reviews,
              delivery: item.delivery,
              serpapi_product_id: item.product_id,
              type: 'shopping'
            };
          });

        logger.info(`Found ${results.length} shopping results`, { country, query });
        return results;
      }
      return [];
      
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
    return true; 
  }
}

module.exports = new SearchService();