const Gym = require('../models/Gym');
const Plan = require('../models/Plan');
const Student = require('../models/Student');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class GymService {
  async createGym(gymData) {
    try {
      const gym = new Gym(gymData);
      await gym.save();
      logger.info(`Gimnasio creado: ${gym.name}`);
      return gym;
    } catch (error) {
      logger.error('Error al crear gimnasio:', error);
      throw error;
    }
  }

  async updateGym(gymId, updateData) {
    try {
      const gym = await Gym.findById(gymId);
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }

      Object.assign(gym, updateData);
      await gym.save();
      logger.info(`Gimnasio actualizado: ${gym.name}`);
      return gym;
    } catch (error) {
      logger.error('Error al actualizar gimnasio:', error);
      throw error;
    }
  }

  async deleteGym(gymId) {
    try {
      const gym = await Gym.findById(gymId);
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }

      // Verificar si hay estudiantes asociados
      const studentCount = await Student.countDocuments({ gymId });
      if (studentCount > 0) {
        throw new ValidationError('No se puede eliminar el gimnasio porque tiene estudiantes asociados');
      }

      await gym.remove();
      logger.info(`Gimnasio eliminado: ${gym.name}`);
      return { message: 'Gimnasio eliminado exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar gimnasio:', error);
      throw error;
    }
  }

  async getGym(gymId) {
    try {
      const gym = await Gym.findById(gymId);
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }
      return gym;
    } catch (error) {
      logger.error('Error al obtener gimnasio:', error);
      throw error;
    }
  }

  async listGyms(filters = {}, page = 1, limit = 10) {
    try {
      const query = Gym.find(filters)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const [gyms, total] = await Promise.all([
        query.exec(),
        Gym.countDocuments(filters)
      ]);

      return {
        gyms,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error al listar gimnasios:', error);
      throw error;
    }
  }

  async updateGymPlan(gymId, planId) {
    try {
      const [gym, plan] = await Promise.all([
        Gym.findById(gymId),
        Plan.findById(planId)
      ]);

      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }
      if (!plan) {
        throw new NotFoundError('Plan no encontrado');
      }

      // Verificar si el gimnasio excede los límites del nuevo plan
      const studentCount = await Student.countDocuments({ gymId });
      if (studentCount > plan.maxStudents) {
        throw new ValidationError('El gimnasio excede el límite de estudiantes del plan');
      }

      gym.planId = planId;
      await gym.save();
      logger.info(`Plan actualizado para gimnasio ${gym.name}: ${plan.name}`);
      return gym;
    } catch (error) {
      logger.error('Error al actualizar plan del gimnasio:', error);
      throw error;
    }
  }

  async getGymStats(gymId) {
    try {
      const gym = await Gym.findById(gymId);
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }

      const [
        studentCount,
        activeStudents,
        expiredStudents,
        newStudents
      ] = await Promise.all([
        Student.countDocuments({ gymId }),
        Student.countDocuments({ gymId, 'membership.status': 'active' }),
        Student.countDocuments({ gymId, 'membership.status': 'expired' }),
        Student.countDocuments({
          gymId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalStudents: studentCount,
        activeStudents,
        expiredStudents,
        newStudents,
        plan: gym.planId
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del gimnasio:', error);
      throw error;
    }
  }

  async validateGymLimits(gymId) {
    try {
      const gym = await Gym.findById(gymId).populate('planId');
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }

      const studentCount = await Student.countDocuments({ gymId });
      const plan = gym.planId;

      return {
        currentStudents: studentCount,
        maxStudents: plan.maxStudents,
        canAddMore: studentCount < plan.maxStudents
      };
    } catch (error) {
      logger.error('Error al validar límites del gimnasio:', error);
      throw error;
    }
  }
}

module.exports = new GymService(); 