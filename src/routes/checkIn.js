const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const checkInController = require('../controllers/checkInController');
const { authenticate, authorize } = require('../middleware/auth');

// Validaciones
const checkInValidation = [
  body('checkInMethod').isIn(['dni', 'qr']).withMessage('Método de check-in inválido'),
  body('dni').if(body('checkInMethod').equals('dni')).notEmpty().withMessage('DNI requerido'),
  body('qrCode').if(body('checkInMethod').equals('qr')).notEmpty().withMessage('Código QR requerido'),
  body('location').optional().isObject().withMessage('Ubicación inválida'),
  body('location.latitude').optional().isNumeric().withMessage('Latitud inválida'),
  body('location.longitude').optional().isNumeric().withMessage('Longitud inválida')
];

// Rutas
router.post('/',
  authenticate,
  authorize('gym_owner'),
  checkInValidation,
  checkInController.registerCheckIn
);

router.get('/',
  authenticate,
  authorize('gym_owner'),
  checkInController.getCheckIns
);

router.get('/:id',
  authenticate,
  authorize('gym_owner'),
  checkInController.getCheckInById
);

module.exports = router; 