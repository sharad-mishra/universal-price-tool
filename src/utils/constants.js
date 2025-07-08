const ERROR_MESSAGES = {
  INVALID_COUNTRY: 'Invalid or unsupported country code',
  INVALID_QUERY: 'Invalid search query',
  SEARCH_FAILED: 'Search request failed',
  AI_PROCESSING_FAILED: 'AI processing failed',
  NO_RESULTS: 'No results found',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error'
};

const API_LIMITS = {
  SERPAPI_MONTHLY: 100,
  GEMINI_DAILY: 1500,
  GEMINI_MINUTE: 15,
  MAX_RESULTS: 20,
  QUERY_MIN_LENGTH: 2,
  QUERY_MAX_LENGTH: 200
};

const CURRENCY_MAP = {
  'US': 'USD',
  'IN': 'INR',
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'JP': 'JPY',
  'CN': 'CNY',
  'BR': 'BRL',
  'RU': 'RUB',
  'AU': 'AUD',
  'CA': 'CAD',
  'MX': 'MXN',
  'KR': 'KRW',
  'IT': 'EUR',
  'ES': 'EUR'
};

module.exports = {
  ERROR_MESSAGES,
  API_LIMITS,
  CURRENCY_MAP
};
