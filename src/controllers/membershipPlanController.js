const membershipPlanService = require('../services/membershipPlanService');

class MembershipPlanController {
  async createPlan(req, res, next) {
    try {
      const plan = await membershipPlanService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await membershipPlanService.updatePlan(id, req.body);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req, res, next) {
    try {
      const { id } = req.params;
      const result = await membershipPlanService.deletePlan(id);
      res.json(result);
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
}

module.exports = new MembershipPlanController(); 