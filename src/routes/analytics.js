const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación y autorización de propietario de gimnasio
router.use(auth);
router.use(authorize('gym_owner'));

// Obtener estadísticas de estudiantes
router.get('/students', analyticsController.getStudentStats);

// Obtener estadísticas de check-ins
router.get('/check-ins', analyticsController.getCheckInStats);

// Obtener estadísticas de ingresos
router.get('/revenue', analyticsController.getRevenueStats);

module.exports = router; 