const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { rateLimiter }; 