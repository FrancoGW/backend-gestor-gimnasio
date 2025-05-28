const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  data: {
    checkIns: {
      total: {
        type: Number,
        default: 0
      },
      byMethod: {
        dni: {
          type: Number,
          default: 0
        },
        qr: {
          type: Number,
          default: 0
        },
        camera: {
          type: Number,
          default: 0
        }
      },
      byHour: {
        type: [Number],
        default: Array(24).fill(0)
      }
    },
    students: {
      total: {
        type: Number,
        default: 0
      },
      active: {
        type: Number,
        default: 0
      },
      expired: {
        type: Number,
        default: 0
      },
      new: {
        type: Number,
        default: 0
      }
    },
    revenue: {
      total: {
        type: Number,
        default: 0
      },
      byPlan: [{
        planId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MembershipPlan'
        },
        amount: Number,
        count: Number
      }]
    }
  }
}, {
  timestamps: true
});

// Índices
analyticsSchema.index({ gymId: 1, type: 1, date: -1 });
analyticsSchema.index({ date: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // TTL: 1 año

// Método para generar analytics diarios
analyticsSchema.statics.generateDailyAnalytics = async function(gymId, date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const [checkInStats, studentStats, revenueStats] = await Promise.all([
    this.aggregateCheckInStats(gymId, startDate, endDate),
    this.aggregateStudentStats(gymId, startDate, endDate),
    this.aggregateRevenueStats(gymId, startDate, endDate)
  ]);

  const analytics = new this({
    gymId,
    type: 'daily',
    date: startDate,
    data: {
      checkIns: checkInStats,
      students: studentStats,
      revenue: revenueStats
    }
  });

  return analytics.save();
};

// Método para generar analytics semanales
analyticsSchema.statics.generateWeeklyAnalytics = async function(gymId, date) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const [checkInStats, studentStats, revenueStats] = await Promise.all([
    this.aggregateCheckInStats(gymId, startDate, endDate),
    this.aggregateStudentStats(gymId, startDate, endDate),
    this.aggregateRevenueStats(gymId, startDate, endDate)
  ]);

  const analytics = new this({
    gymId,
    type: 'weekly',
    date: startDate,
    data: {
      checkIns: checkInStats,
      students: studentStats,
      revenue: revenueStats
    }
  });

  return analytics.save();
};

// Método para generar analytics mensuales
analyticsSchema.statics.generateMonthlyAnalytics = async function(gymId, date) {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const [checkInStats, studentStats, revenueStats] = await Promise.all([
    this.aggregateCheckInStats(gymId, startDate, endDate),
    this.aggregateStudentStats(gymId, startDate, endDate),
    this.aggregateRevenueStats(gymId, startDate, endDate)
  ]);

  const analytics = new this({
    gymId,
    type: 'monthly',
    date: startDate,
    data: {
      checkIns: checkInStats,
      students: studentStats,
      revenue: revenueStats
    }
  });

  return analytics.save();
};

// Método para agregar estadísticas de check-ins
analyticsSchema.statics.aggregateCheckInStats = async function(gymId, startDate, endDate) {
  const CheckIn = mongoose.model('CheckIn');
  
  const [totalStats, methodStats, hourStats] = await Promise.all([
    CheckIn.countDocuments({ gymId, timestamp: { $gte: startDate, $lte: endDate } }),
    CheckIn.aggregate([
      {
        $match: {
          gymId: mongoose.Types.ObjectId(gymId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$checkInMethod',
          count: { $sum: 1 }
        }
      }
    ]),
    CheckIn.aggregate([
      {
        $match: {
          gymId: mongoose.Types.ObjectId(gymId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const byMethod = {
    dni: 0,
    qr: 0,
    camera: 0
  };

  methodStats.forEach(stat => {
    byMethod[stat._id] = stat.count;
  });

  const byHour = Array(24).fill(0);
  hourStats.forEach(stat => {
    byHour[stat._id] = stat.count;
  });

  return {
    total: totalStats,
    byMethod,
    byHour
  };
};

// Método para agregar estadísticas de estudiantes
analyticsSchema.statics.aggregateStudentStats = async function(gymId, startDate, endDate) {
  const Student = mongoose.model('Student');
  
  const stats = await Student.aggregate([
    {
      $match: {
        gymId: mongoose.Types.ObjectId(gymId)
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              { $eq: ['$membership.status', 'active'] },
              1,
              0
            ]
          }
        },
        expired: {
          $sum: {
            $cond: [
              { $eq: ['$membership.status', 'expired'] },
              1,
              0
            ]
          }
        },
        new: {
          $sum: {
            $cond: [
              { $gte: ['$joinDate', startDate] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    active: 0,
    expired: 0,
    new: 0
  };
};

// Método para agregar estadísticas de ingresos
analyticsSchema.statics.aggregateRevenueStats = async function(gymId, startDate, endDate) {
  const Student = mongoose.model('Student');
  
  const stats = await Student.aggregate([
    {
      $match: {
        gymId: mongoose.Types.ObjectId(gymId),
        'membership.lastPayment': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$membership.planId',
        amount: { $sum: '$membership.price' },
        count: { $sum: 1 }
      }
    }
  ]);

  const total = stats.reduce((sum, stat) => sum + stat.amount, 0);

  return {
    total,
    byPlan: stats
  };
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics; 