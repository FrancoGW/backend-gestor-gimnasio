const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

// Rutas públicas
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/reset-password', validate(schemas.resetPassword), authController.resetPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/set-new-password/:token', validate(schemas.setNewPassword), authController.setNewPassword);

// Rutas protegidas
router.post('/change-password', authMiddleware, validate(schemas.changePassword), authController.changePassword);

module.exports = router; 