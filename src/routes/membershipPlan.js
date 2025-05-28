const express = require('express');
const router = express.Router();
const membershipPlanController = require('../controllers/membershipPlanController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, gymOwnerMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas para propietarios de gimnasio
router.post('/', gymOwnerMiddleware, validate(schemas.createMembershipPlan), membershipPlanController.createPlan);
router.get('/', gymOwnerMiddleware, membershipPlanController.listPlans);
router.get('/:id', gymOwnerMiddleware, membershipPlanController.getPlan);
router.put('/:id', gymOwnerMiddleware, validate(schemas.updateMembershipPlan), membershipPlanController.updatePlan);
router.delete('/:id', gymOwnerMiddleware, membershipPlanController.deletePlan);
router.get('/:id/stats', gymOwnerMiddleware, membershipPlanController.getPlanStats);
router.put('/:id/price', gymOwnerMiddleware, validate(schemas.updatePlanPrice), membershipPlanController.updatePlanPrice);

// Rutas para estadísticas
router.get('/popular', gymOwnerMiddleware, membershipPlanController.getPopularPlans);
router.get('/revenue', gymOwnerMiddleware, membershipPlanController.getRevenueByPlan);

module.exports = router; 