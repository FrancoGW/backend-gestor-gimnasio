const analyticsService = require('../services/analyticsService');
const Student = require('../models/Student');
const CheckIn = require('../models/CheckIn');
const MembershipPlan = require('../models/MembershipPlan');
const Gym = require('../models/Gym');

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
      const { period = 'week' } = req.query;
      const gymId = req.user.gymId;

      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const checkIns = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: period === 'week' ? '%Y-%m-%d' : '%Y-%m',
                date: '$timestamp'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Obtener horas pico
      const peakHours = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      res.json({
        success: true,
        data: {
          checkIns,
          peakHours
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentStats(req, res, next) {
    try {
      const gymId = req.user.gymId;

      const [
        totalStudents,
        activeStudents,
        expiredStudents,
        studentsByPlan
      ] = await Promise.all([
        Student.countDocuments({ gymId }),
        Student.countDocuments({ gymId, membershipStatus: 'active' }),
        Student.countDocuments({ gymId, membershipStatus: 'expired' }),
        Student.aggregate([
          { $match: { gymId } },
          {
            $group: {
              _id: '$membershipPlanId',
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'membershipplans',
              localField: '_id',
              foreignField: '_id',
              as: 'plan'
            }
          },
          { $unwind: '$plan' },
          {
            $project: {
              planName: '$plan.name',
              count: 1,
              _id: 0
            }
          }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalStudents,
          activeStudents,
          expiredStudents,
          studentsByPlan
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueStats(req, res, next) {
    try {
      const { period = 'month' } = req.query;
      const gymId = req.user.gymId;

      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Obtener ingresos por plan
      const revenueByPlan = await Student.aggregate([
        {
          $match: {
            gymId,
            membershipStartDate: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'membershipplans',
            localField: 'membershipPlanId',
            foreignField: '_id',
            as: 'plan'
          }
        },
        { $unwind: '$plan' },
        {
          $group: {
            _id: '$plan._id',
            planName: { $first: '$plan.name' },
            revenue: { $sum: '$plan.price' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Obtener ingresos totales
      const totalRevenue = revenueByPlan.reduce((sum, plan) => sum + plan.revenue, 0);

      res.json({
        success: true,
        data: {
          totalRevenue,
          revenueByPlan
        }
      });
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