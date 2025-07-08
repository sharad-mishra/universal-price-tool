const { API_LIMITS, ERROR_MESSAGES } = require('./constants');

function validatePriceRequest(data) {
  const errors = [];

  if (!data) {
    errors.push('Request data is required');
    return { isValid: false, errors };
  }

  if (!data.country) {
    errors.push(ERROR_MESSAGES.INVALID_COUNTRY);
  } else if (typeof data.country !== 'string') {
    errors.push('Country must be a string');
  } else if (data.country.length !== 2) {
    errors.push('Country must be a 2-letter ISO code');
  }

  if (!data.query) {
    errors.push(ERROR_MESSAGES.INVALID_QUERY);
  } else if (typeof data.query !== 'string') {
    errors.push('Query must be a string');
  } else if (data.query.trim().length < API_LIMITS.QUERY_MIN_LENGTH) {
    errors.push(`Query must be at least ${API_LIMITS.QUERY_MIN_LENGTH} characters long`);
  } else if (data.query.trim().length > API_LIMITS.QUERY_MAX_LENGTH) {
    errors.push(`Query must be less than ${API_LIMITS.QUERY_MAX_LENGTH} characters`);
  } else if (/[<>;{}]/.test(data.query)) {
    errors.push('Query contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      country: data.country?.toUpperCase(),
      query: sanitizeQuery(data.query)
    }
  };
}

function validateCountryCode(countryCode) {
  return typeof countryCode === 'string' && countryCode.length === 2;
}

function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .trim()
    .replace(/[<>;{}]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, API_LIMITS.QUERY_MAX_LENGTH);
}

function validateProductData(product) {
  const errors = [];

  if (!product) {
    errors.push('Product data is required');
    return { isValid: false, errors };
  }

  if (!product.productName || typeof product.productName !== 'string') {
    errors.push('Product name is required and must be a string');
  }

  if (!product.price) {
    errors.push('Price is required');
  } else if (isNaN(parseFloat(product.price))) {
    errors.push('Price must be a valid number');
  }

  if (!product.currency || typeof product.currency !== 'string') {
    errors.push('Currency is required and must be a string');
  }

  if (!product.link || typeof product.link !== 'string') {
    errors.push('Link is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function validateApiKey(apiKey, keyName) {
  if (!apiKey) {
    throw new Error(`${keyName} is required`);
  }
  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    throw new Error(`${keyName} appears to be invalid`);
  }
  return true;
}

module.exports = {
  validatePriceRequest,
  validateCountryCode,
  sanitizeQuery,
  validateProductData,
  validateApiKey
};