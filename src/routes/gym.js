const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gymController = require('../controllers/gymController');
const { authenticate, authorize, checkGymAccess } = require('../middleware/auth');

// Validaciones
const gymValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('address').notEmpty().withMessage('La dirección es requerida'),
  body('phone').notEmpty().withMessage('El teléfono es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('ownerId').isMongoId().withMessage('ID de propietario inválido'),
  body('settings').optional().isObject().withMessage('Configuración inválida')
];

// Rutas
router.post('/', 
  authenticate, 
  authorize('superadmin'), 
  gymValidation, 
  gymController.createGym
);

router.get('/', 
  authenticate, 
  authorize('superadmin'), 
  gymController.getAllGyms
);

router.get('/:id', 
  authenticate, 
  checkGymAccess, 
  gymController.getGymById
);

router.put('/:id', 
  authenticate, 
  checkGymAccess, 
  gymValidation, 
  gymController.updateGym
);

router.delete('/:id', 
  authenticate, 
  authorize('superadmin'), 
  gymController.deleteGym
);

router.get('/:id/stats', 
  authenticate, 
  checkGymAccess, 
  gymController.getGymStats
);

module.exports = router; 