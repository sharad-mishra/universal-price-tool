const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL || 3600),
      checkperiod: 120
    });

    this.cache.on('set', (key, value) => {
      logger.debug('Cache set', { key, valueLength: Array.isArray(value) ? value.length : 1 });
    });

    this.cache.on('del', key => {
      logger.debug('Cache deleted', { key });
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

module.exports = new CacheService();