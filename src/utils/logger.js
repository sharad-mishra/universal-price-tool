const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'price-comparison-api',
    version: require('../../package.json').version,
    environment: process.env.NODE_ENV || ('production')
  },
  transports: [
    // Always log to console
    new winston.transports.Console(),
    // Log to files only in non-production or if /tmp is available
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error'
          }),
          new winston.transports.File({
            filename: path.join('logs', 'combined.log')
          })
        ]
      : [
          new winston.transports.File({
            filename: path.join('/tmp', 'error.log'),
            level: 'error'
          }),
          new winston.transports.File({
            filename: path.join('/tmp', 'combined.log')
          })
        ])
  ]
});

// Ensure logs directory exists only in non-production
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const logDir = 'logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

module.exports = logger;
