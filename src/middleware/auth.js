const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      if (!roles.includes(req.user.role)) {
        throw new UnauthorizedError('No tiene permisos para realizar esta acción');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
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
  authMiddleware,
  roleMiddleware,
  gymOwnerMiddleware,
  studentMiddleware,
  planLimitsMiddleware,
  tenantMiddleware
}; 