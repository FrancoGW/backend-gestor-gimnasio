const express = require('express');
const router = express.Router();
const checkInController = require('../controllers/checkInController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, gymOwnerMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas para propietarios de gimnasio
router.post('/', gymOwnerMiddleware, validate(schemas.checkIn), checkInController.registerCheckIn);
router.get('/', gymOwnerMiddleware, checkInController.listCheckIns);
router.get('/:id', gymOwnerMiddleware, checkInController.getCheckIn);
router.get('/student/:studentId', gymOwnerMiddleware, checkInController.getStudentCheckIns);

// Rutas para estadísticas
router.get('/stats', gymOwnerMiddleware, checkInController.getCheckInStats);
router.get('/active', gymOwnerMiddleware, checkInController.getActiveStudents);
router.get('/peak-hours', gymOwnerMiddleware, checkInController.getPeakHours);

module.exports = router; 