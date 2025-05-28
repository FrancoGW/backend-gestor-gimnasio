const Analytics = require('../models/Analytics');
const CheckIn = require('../models/CheckIn');
const Student = require('../models/Student');
const logger = require('../utils/logger');

class AnalyticsService {
  async generateDailyAnalytics(gymId, date = new Date()) {
    try {
      const analytics = await Analytics.generateDailyAnalytics(gymId, date);
      logger.info(`Analytics diarios generados para gimnasio ${gymId} en fecha ${date}`);
      return analytics;
    } catch (error) {
      logger.error('Error al generar analytics diarios:', error);
      throw error;
    }
  }

  async generateWeeklyAnalytics(gymId, date = new Date()) {
    try {
      const analytics = await Analytics.generateWeeklyAnalytics(gymId, date);
      logger.info(`Analytics semanales generados para gimnasio ${gymId} en fecha ${date}`);
      return analytics;
    } catch (error) {
      logger.error('Error al generar analytics semanales:', error);
      throw error;
    }
  }

  async generateMonthlyAnalytics(gymId, date = new Date()) {
    try {
      const analytics = await Analytics.generateMonthlyAnalytics(gymId, date);
      logger.info(`Analytics mensuales generados para gimnasio ${gymId} en fecha ${date}`);
      return analytics;
    } catch (error) {
      logger.error('Error al generar analytics mensuales:', error);
      throw error;
    }
  }

  async getCheckInStats(gymId, startDate, endDate) {
    try {
      const stats = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            checkInTime: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              method: '$checkInMethod',
              hour: { $hour: '$checkInTime' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      return this.formatCheckInStats(stats);
    } catch (error) {
      logger.error('Error al obtener estadísticas de check-ins:', error);
      throw error;
    }
  }

  async getStudentStats(gymId) {
    try {
      const stats = await Student.aggregate([
        {
          $match: { gymId }
        },
        {
          $group: {
            _id: '$membership.status',
            count: { $sum: 1 }
          }
        }
      ]);

      return this.formatStudentStats(stats);
    } catch (error) {
      logger.error('Error al obtener estadísticas de estudiantes:', error);
      throw error;
    }
  }

  async getRevenueStats(gymId, startDate, endDate) {
    try {
      const stats = await Student.aggregate([
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

      return this.formatRevenueStats(stats);
    } catch (error) {
      logger.error('Error al obtener estadísticas de ingresos:', error);
      throw error;
    }
  }

  formatCheckInStats(stats) {
    const formatted = {
      byMethod: {},
      byHour: {}
    };

    stats.forEach(stat => {
      const { method, hour } = stat._id;
      
      // Estadísticas por método
      if (!formatted.byMethod[method]) {
        formatted.byMethod[method] = 0;
      }
      formatted.byMethod[method] += stat.count;

      // Estadísticas por hora
      if (!formatted.byHour[hour]) {
        formatted.byHour[hour] = 0;
      }
      formatted.byHour[hour] += stat.count;
    });

    return formatted;
  }

  formatStudentStats(stats) {
    const formatted = {
      total: 0,
      active: 0,
      expired: 0,
      new: 0
    };

    stats.forEach(stat => {
      formatted.total += stat.count;
      switch (stat._id) {
        case 'active':
          formatted.active = stat.count;
          break;
        case 'expired':
          formatted.expired = stat.count;
          break;
        case 'new':
          formatted.new = stat.count;
          break;
      }
    });

    return formatted;
  }

  formatRevenueStats(stats) {
    const formatted = {
      total: 0,
      byPlan: {}
    };

    stats.forEach(stat => {
      formatted.total += stat.total;
      formatted.byPlan[stat._id] = {
        total: stat.total,
        count: stat.count
      };
    });

    return formatted;
  }

  async getDashboardStats(gymId) {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [checkInStats, studentStats, revenueStats] = await Promise.all([
        this.getCheckInStats(gymId, startOfMonth, endOfMonth),
        this.getStudentStats(gymId),
        this.getRevenueStats(gymId, startOfMonth, endOfMonth)
      ]);

      return {
        checkIns: checkInStats,
        students: studentStats,
        revenue: revenueStats
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService(); 