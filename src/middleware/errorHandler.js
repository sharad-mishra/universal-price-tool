const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  
  logger.error(`[${requestId}] Unhandled error`, {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}

module.exports = errorHandler;