const winston = require('winston');

const transports = [];

if (process.env.NODE_ENV !== 'production') {
  // En desarrollo, loguea a archivos y consola
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  );
} else {
  // En producción/serverless, solo consola
  transports.push(
    new winston.transports.Console({ format: winston.format.simple() })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

module.exports = logger; 