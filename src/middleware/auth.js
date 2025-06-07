const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

// Middleware para verificar token JWT
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para realizar esta acción',
        code: 'UNAUTHORIZED_ROLE'
      });
    }
    next();
  };
};

// Middleware para verificar acceso al gimnasio
exports.checkGymAccess = async (req, res, next) => {
  try {
    const gymId = req.params.gymId || req.body.gymId;
    
    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: 'ID de gimnasio no proporcionado',
        code: 'GYM_ID_MISSING'
      });
    }

    // Superadmin tiene acceso a todos los gimnasios
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Verificar que el usuario pertenezca al gimnasio
    if (req.user.gymId.toString() !== gymId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tiene acceso a este gimnasio',
        code: 'GYM_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const gymOwnerMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'gym_owner') {
      throw new ForbiddenError('Acceso denegado. Se requiere rol de propietario de gimnasio');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const studentMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      throw new ForbiddenError('Acceso denegado. Se requiere rol de estudiante');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const planLimitsMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.gymId) {
      throw new UnauthorizedError('Usuario no autenticado o sin gimnasio asociado');
    }

    const Gym = require('../models/Gym');
    const gym = await Gym.findById(req.user.gymId);

    if (!gym) {
      throw new UnauthorizedError('Gimnasio no encontrado');
    }

    const limits = await gym.checkPlanLimits();

    if (limits.isOverLimit) {
      throw new UnauthorizedError('Se ha alcanzado el límite de alumnos permitido por el plan');
    }

    req.gymLimits = limits;
    next();
  } catch (error) {
    next(error);
  }
};

const tenantMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    // Para superadmin, no aplicamos el middleware
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Para propietarios y clientes, verificamos el gimnasio
    if (!req.user.gymId) {
      throw new UnauthorizedError('Usuario no asociado a ningún gimnasio');
    }

    // Agregamos el gymId a la query para filtrar por tenant
    req.tenantId = req.user.gymId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  auth: authenticate,
  authenticate,
  authorize,
  checkGymAccess,
  gymOwnerMiddleware,
  studentMiddleware,
  planLimitsMiddleware,
  tenantMiddleware
}; 