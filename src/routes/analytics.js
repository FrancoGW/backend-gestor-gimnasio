const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, gymOwnerMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas para propietarios de gimnasio
router.get('/daily', gymOwnerMiddleware, analyticsController.generateDailyAnalytics);
router.get('/weekly', gymOwnerMiddleware, analyticsController.generateWeeklyAnalytics);
router.get('/monthly', gymOwnerMiddleware, analyticsController.generateMonthlyAnalytics);
router.get('/check-ins', gymOwnerMiddleware, analyticsController.getCheckInStats);
router.get('/students', gymOwnerMiddleware, analyticsController.getStudentStats);
router.get('/revenue', gymOwnerMiddleware, analyticsController.getRevenueStats);
router.get('/dashboard', gymOwnerMiddleware, analyticsController.getDashboardStats);

module.exports = router; 