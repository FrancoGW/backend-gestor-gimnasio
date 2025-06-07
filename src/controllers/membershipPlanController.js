const membershipPlanService = require('../services/membershipPlanService');
const MembershipPlan = require('../models/MembershipPlan');

class MembershipPlanController {
  async createPlan(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        duration,
        durationType,
        features
      } = req.body;

      const gymId = req.user.gymId;

      // Verificar si ya existe un plan con el mismo nombre en el gimnasio
      const existingPlan = await MembershipPlan.findOne({ gymId, name });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un plan con este nombre',
          code: 'PLAN_NAME_EXISTS'
        });
      }

      // Crear plan
      const plan = new MembershipPlan({
        gymId,
        name,
        description,
        price,
        duration,
        durationType,
        features
      });

      await plan.save();

      res.status(201).json({
        success: true,
        data: {
          plan
        },
        message: 'Plan de membresía creado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        duration,
        durationType,
        features,
        isActive
      } = req.body;

      const plan = await MembershipPlan.findById(req.params.id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de membresía no encontrado',
          code: 'PLAN_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (plan.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este plan',
          code: 'ACCESS_DENIED'
        });
      }

      // Si se cambia el nombre, verificar que no exista otro plan con ese nombre
      if (name && name !== plan.name) {
        const existingPlan = await MembershipPlan.findOne({
          gymId: req.user.gymId,
          name,
          _id: { $ne: plan._id }
        });

        if (existingPlan) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un plan con este nombre',
            code: 'PLAN_NAME_EXISTS'
          });
        }
      }

      // Actualizar campos
      plan.name = name || plan.name;
      plan.description = description || plan.description;
      plan.price = price || plan.price;
      plan.duration = duration || plan.duration;
      plan.durationType = durationType || plan.durationType;
      plan.features = features || plan.features;
      plan.isActive = isActive !== undefined ? isActive : plan.isActive;

      await plan.save();

      res.json({
        success: true,
        data: {
          plan
        },
        message: 'Plan de membresía actualizado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req, res, next) {
    try {
      const plan = await MembershipPlan.findById(req.params.id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de membresía no encontrado',
          code: 'PLAN_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (plan.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este plan',
          code: 'ACCESS_DENIED'
        });
      }

      // Verificar si hay estudiantes usando este plan
      if (plan.studentsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un plan que tiene estudiantes activos',
          code: 'PLAN_IN_USE'
        });
      }

      // Desactivar plan en lugar de eliminarlo
      plan.isActive = false;
      await plan.save();

      res.json({
        success: true,
        message: 'Plan de membresía desactivado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlan(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await membershipPlanService.getPlan(id);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  async listPlans(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await membershipPlanService.listPlans(req.user.gymId, filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPlanStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await membershipPlanService.getPlanStats(id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async updatePlanPrice(req, res, next) {
    try {
      const { id } = req.params;
      const { newPrice } = req.body;
      const plan = await membershipPlanService.updatePlanPrice(id, newPrice);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  async getPopularPlans(req, res, next) {
    try {
      const { limit = 5 } = req.query;
      const plans = await membershipPlanService.getPopularPlans(req.user.gymId, parseInt(limit));
      res.json(plans);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueByPlan(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const revenue = await membershipPlanService.getRevenueByPlan(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(revenue);
    } catch (error) {
      next(error);
    }
  }

  async getAllPlans(req, res, next) {
    try {
      const { active } = req.query;
      const gymId = req.user.gymId;

      const query = { gymId };
      if (active === 'true') {
        query.isActive = true;
      }

      const plans = await MembershipPlan.find(query)
        .sort('-createdAt');

      res.json({
        success: true,
        data: {
          plans
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlanById(req, res, next) {
    try {
      const plan = await MembershipPlan.findById(req.params.id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de membresía no encontrado',
          code: 'PLAN_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (plan.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este plan',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        data: {
          plan
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MembershipPlanController(); 