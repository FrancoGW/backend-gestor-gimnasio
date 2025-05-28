const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, roleMiddleware, gymOwnerMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas para superadmin
router.post('/', roleMiddleware('superadmin'), validate(schemas.createGym), gymController.createGym);
router.get('/', roleMiddleware('superadmin'), gymController.listGyms);

// Rutas para propietarios de gimnasio
router.get('/:id', gymOwnerMiddleware, gymController.getGym);
router.put('/:id', gymOwnerMiddleware, validate(schemas.updateGym), gymController.updateGym);
router.delete('/:id', gymOwnerMiddleware, gymController.deleteGym);
router.put('/:id/plan', gymOwnerMiddleware, validate(schemas.updateGymPlan), gymController.updateGymPlan);
router.get('/:id/stats', gymOwnerMiddleware, gymController.getGymStats);
router.get('/:id/limits', gymOwnerMiddleware, gymController.validateGymLimits);

module.exports = router; 