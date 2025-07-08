const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'price-comparison-api',
    version: require('../../package.json').version,
    environment: process.env.NODE_ENV || 'production'
  },
  transports: [
    // Always log to console
    new winston.transports.Console()
  ]
});

// Only add file transports in development
if (process.env.NODE_ENV === 'development') {
  const fs = require('fs');
  const path = require('path');
  const logDir = 'logs';
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log')
  }));
}

module.exports = logger;
