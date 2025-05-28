const { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
      errors: err.errors
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      status: 'error',
      message: err.message
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      status: 'error',
      message: err.message
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      message: err.message
    });
  }

  // Error por defecto
  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor'
  });
};

module.exports = { errorHandler }; 