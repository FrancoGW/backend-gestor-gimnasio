const gymService = require('../services/gymService');

class GymController {
  async createGym(req, res, next) {
    try {
      const gym = await gymService.createGym(req.body);
      res.status(201).json(gym);
    } catch (error) {
      next(error);
    }
  }

  async updateGym(req, res, next) {
    try {
      const { id } = req.params;
      const gym = await gymService.updateGym(id, req.body);
      res.json(gym);
    } catch (error) {
      next(error);
    }
  }

  async deleteGym(req, res, next) {
    try {
      const { id } = req.params;
      const result = await gymService.deleteGym(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getGym(req, res, next) {
    try {
      const { id } = req.params;
      const gym = await gymService.getGym(id);
      res.json(gym);
    } catch (error) {
      next(error);
    }
  }

  async listGyms(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await gymService.listGyms(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateGymPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      const gym = await gymService.updateGymPlan(id, planId);
      res.json(gym);
    } catch (error) {
      next(error);
    }
  }

  async getGymStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await gymService.getGymStats(id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async validateGymLimits(req, res, next) {
    try {
      const { id } = req.params;
      const limits = await gymService.validateGymLimits(id);
      res.json(limits);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GymController(); 