const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware, gymOwnerMiddleware } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas para propietarios de gimnasio
router.post('/', gymOwnerMiddleware, validate(schemas.createStudent), studentController.createStudent);
router.get('/', gymOwnerMiddleware, studentController.listStudents);
router.get('/:id', gymOwnerMiddleware, studentController.getStudent);
router.put('/:id', gymOwnerMiddleware, validate(schemas.updateStudent), studentController.updateStudent);
router.delete('/:id', gymOwnerMiddleware, studentController.deleteStudent);
router.put('/:id/membership', gymOwnerMiddleware, validate(schemas.updateMembership), studentController.updateMembership);
router.get('/:id/check-ins', gymOwnerMiddleware, studentController.getCheckInHistory);

// Rutas para check-in
router.post('/:id/check-in', gymOwnerMiddleware, validate(schemas.checkIn), studentController.checkIn);

// Ruta para procesar membresías expiradas
router.post('/process-expired', gymOwnerMiddleware, studentController.processExpiredMemberships);

module.exports = router; 