const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// Validaciones
const studentValidation = [
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('dni').notEmpty().withMessage('El DNI es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('phone').notEmpty().withMessage('El teléfono es requerido'),
  body('membershipPlanId').isMongoId().withMessage('ID de plan inválido'),
  body('photo').optional().isURL().withMessage('URL de foto inválida')
];

// Rutas
router.post('/',
  authenticate,
  authorize('gym_owner'),
  studentValidation,
  studentController.createStudent
);

router.get('/',
  authenticate,
  authorize('gym_owner'),
  studentController.getAllStudents
);

router.get('/:id',
  authenticate,
  authorize('gym_owner'),
  studentController.getStudentById
);

router.put('/:id',
  authenticate,
  authorize('gym_owner'),
  studentValidation,
  studentController.updateStudent
);

router.delete('/:id',
  authenticate,
  authorize('gym_owner'),
  studentController.deleteStudent
);

router.post('/:id/send-qr-card',
  authenticate,
  authorize('gym_owner'),
  studentController.sendQRCard
);

module.exports = router; 