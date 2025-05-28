const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async generateDailyAnalytics(req, res, next) {
    try {
      const { date } = req.query;
      const analytics = await analyticsService.generateDailyAnalytics(
        req.user.gymId,
        date ? new Date(date) : new Date()
      );
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  async generateWeeklyAnalytics(req, res, next) {
    try {
      const { date } = req.query;
      const analytics = await analyticsService.generateWeeklyAnalytics(
        req.user.gymId,
        date ? new Date(date) : new Date()
      );
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  async generateMonthlyAnalytics(req, res, next) {
    try {
      const { date } = req.query;
      const analytics = await analyticsService.generateMonthlyAnalytics(
        req.user.gymId,
        date ? new Date(date) : new Date()
      );
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  async getCheckInStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await analyticsService.getCheckInStats(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getStudentStats(req, res, next) {
    try {
      const stats = await analyticsService.getStudentStats(req.user.gymId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await analyticsService.getRevenueStats(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await analyticsService.getDashboardStats(req.user.gymId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController(); 