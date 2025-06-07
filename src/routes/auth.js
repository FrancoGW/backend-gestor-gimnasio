const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, authenticate } = require('../middleware/auth');

// Validaciones
const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('role').isIn(['superadmin', 'gym_owner', 'client']).withMessage('Rol inválido'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('gymId').optional().isMongoId().withMessage('ID de gimnasio inválido')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// Rutas públicas
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/reset-password', validate(schemas.resetPassword), authController.resetPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/set-new-password/:token', validate(schemas.setNewPassword), authController.setNewPassword);

// Rutas protegidas
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router; 