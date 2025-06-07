const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const membershipPlanController = require('../controllers/membershipPlanController');
const { authenticate, authorize } = require('../middleware/auth');

// Validaciones
const planValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('price').isNumeric().withMessage('El precio debe ser un número'),
  body('duration').isInt({ min: 1 }).withMessage('La duración debe ser un número entero positivo'),
  body('durationType').isIn(['days', 'months']).withMessage('Tipo de duración inválido'),
  body('description').optional().isString().withMessage('La descripción debe ser texto'),
  body('features').optional().isArray().withMessage('Las características deben ser un array')
];

// Rutas
router.post('/',
  authenticate,
  authorize('gym_owner'),
  planValidation,
  membershipPlanController.createPlan
);

router.get('/',
  authenticate,
  authorize('gym_owner'),
  membershipPlanController.getAllPlans
);

router.get('/:id',
  authenticate,
  authorize('gym_owner'),
  membershipPlanController.getPlanById
);

router.put('/:id',
  authenticate,
  authorize('gym_owner'),
  planValidation,
  membershipPlanController.updatePlan
);

router.delete('/:id',
  authenticate,
  authorize('gym_owner'),
  membershipPlanController.deletePlan
);

module.exports = router; 