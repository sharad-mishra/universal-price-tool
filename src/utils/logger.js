const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const { version } = require('../../package.json');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: {
    service: 'price-comparison-api',
    version,
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880,
      maxFiles: 5
    }),
    new transports.File({
      filename: `${logDir}/combined.log`,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;