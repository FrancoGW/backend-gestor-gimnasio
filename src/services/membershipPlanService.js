const MembershipPlan = require('../models/MembershipPlan');
const Student = require('../models/Student');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class MembershipPlanService {
  async createPlan(planData) {
    try {
      const plan = new MembershipPlan(planData);
      await plan.save();
      logger.info(`Plan de membresía creado: ${plan.name}`);
      return plan;
    } catch (error) {
      logger.error('Error al crear plan de membresía:', error);
      throw error;
    }
  }

  async updatePlan(planId, updateData) {
    try {
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }

      // Verificar si hay estudiantes con este plan
      const studentCount = await Student.countDocuments({ 'membership.planId': planId });
      if (studentCount > 0) {
        throw new ValidationError('No se puede modificar el plan porque hay estudiantes asociados');
      }

      Object.assign(plan, updateData);
      await plan.save();
      logger.info(`Plan de membresía actualizado: ${plan.name}`);
      return plan;
    } catch (error) {
      logger.error('Error al actualizar plan de membresía:', error);
      throw error;
    }
  }

  async deletePlan(planId) {
    try {
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }

      // Verificar si hay estudiantes con este plan
      const studentCount = await Student.countDocuments({ 'membership.planId': planId });
      if (studentCount > 0) {
        throw new ValidationError('No se puede eliminar el plan porque hay estudiantes asociados');
      }

      await plan.remove();
      logger.info(`Plan de membresía eliminado: ${plan.name}`);
      return { message: 'Plan de membresía eliminado exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar plan de membresía:', error);
      throw error;
    }
  }

  async getPlan(planId) {
    try {
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }
      return plan;
    } catch (error) {
      logger.error('Error al obtener plan de membresía:', error);
      throw error;
    }
  }

  async listPlans(gymId, filters = {}, page = 1, limit = 10) {
    try {
      const query = MembershipPlan.find({ gymId, ...filters })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ price: 1 });

      const [plans, total] = await Promise.all([
        query.exec(),
        MembershipPlan.countDocuments({ gymId, ...filters })
      ]);

      return {
        plans,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error al listar planes de membresía:', error);
      throw error;
    }
  }

  async getPlanStats(planId) {
    try {
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }

      const [
        totalStudents,
        activeStudents,
        expiredStudents,
        newStudents
      ] = await Promise.all([
        Student.countDocuments({ 'membership.planId': planId }),
        Student.countDocuments({
          'membership.planId': planId,
          'membership.status': 'active'
        }),
        Student.countDocuments({
          'membership.planId': planId,
          'membership.status': 'expired'
        }),
        Student.countDocuments({
          'membership.planId': planId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalStudents,
        activeStudents,
        expiredStudents,
        newStudents,
        revenue: totalStudents * plan.price
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del plan:', error);
      throw error;
    }
  }

  async updatePlanPrice(planId, newPrice) {
    try {
      const plan = await MembershipPlan.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }

      // Verificar si hay estudiantes con este plan
      const studentCount = await Student.countDocuments({ 'membership.planId': planId });
      if (studentCount > 0) {
        throw new ValidationError('No se puede modificar el precio porque hay estudiantes asociados');
      }

      plan.price = newPrice;
      await plan.save();
      logger.info(`Precio actualizado para plan: ${plan.name}`);
      return plan;
    } catch (error) {
      logger.error('Error al actualizar precio del plan:', error);
      throw error;
    }
  }

  async getPopularPlans(gymId, limit = 5) {
    try {
      const plans = await Student.aggregate([
        {
          $match: { gymId }
        },
        {
          $group: {
            _id: '$membership.planId',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);

      const planIds = plans.map(p => p._id);
      const planDetails = await MembershipPlan.find({ _id: { $in: planIds } });

      return planDetails.map(plan => ({
        ...plan.toObject(),
        studentCount: plans.find(p => p._id.toString() === plan._id.toString()).count
      }));
    } catch (error) {
      logger.error('Error al obtener planes populares:', error);
      throw error;
    }
  }

  async getRevenueByPlan(gymId, startDate, endDate) {
    try {
      const revenue = await Student.aggregate([
        {
          $match: {
            gymId,
            'membership.startDate': { $gte: startDate },
            'membership.expiryDate': { $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$membership.planId',
            total: { $sum: '$membership.price' },
            count: { $sum: 1 }
          }
        }
      ]);

      const planIds = revenue.map(r => r._id);
      const plans = await MembershipPlan.find({ _id: { $in: planIds } });

      return revenue.map(r => ({
        plan: plans.find(p => p._id.toString() === r._id.toString()),
        total: r.total,
        count: r.count
      }));
    } catch (error) {
      logger.error('Error al obtener ingresos por plan:', error);
      throw error;
    }
  }
}

module.exports = new MembershipPlanService(); 