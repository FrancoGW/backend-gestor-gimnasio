const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'America/Argentina/Buenos_Aires'
    },
    currency: {
      type: String,
      default: 'ARS'
    },
    logo: String,
    theme: {
      primaryColor: String,
      secondaryColor: String,
      fontFamily: String
    },
    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true
      },
      smsEnabled: {
        type: Boolean,
        default: false
      },
      reminderDays: {
        type: Number,
        default: 7
      }
    }
  },
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    activeStudents: {
      type: Number,
      default: 0
    },
    totalCheckIns: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
gymSchema.index({ ownerId: 1 });
gymSchema.index({ 'subscription.status': 1 });
gymSchema.index({ isActive: 1 });

// Método para actualizar estadísticas
gymSchema.methods.updateStats = async function() {
  const Student = mongoose.model('Student');
  const CheckIn = mongoose.model('CheckIn');

  const [studentStats, checkInStats] = await Promise.all([
    Student.aggregate([
      { $match: { gymId: this._id } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: {
              $cond: [
                { $eq: ['$membership.status', 'active'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    CheckIn.countDocuments({ gymId: this._id })
  ]);

  this.stats = {
    totalStudents: studentStats[0]?.totalStudents || 0,
    activeStudents: studentStats[0]?.activeStudents || 0,
    totalCheckIns: checkInStats,
    lastActivity: new Date()
  };

  return this.save();
};

// Método para verificar límites del plan
gymSchema.methods.checkPlanLimits = async function() {
  const Plan = mongoose.model('Plan');
  const plan = await Plan.findById(this.subscription.planId);
  
  if (!plan) {
    throw new Error('Plan not found');
  }

  const Student = mongoose.model('Student');
  const activeStudents = await Student.countDocuments({
    gymId: this._id,
    'membership.status': 'active'
  });

  return {
    maxStudents: plan.maxStudents,
    currentStudents: activeStudents,
    isOverLimit: plan.maxStudents !== null && activeStudents >= plan.maxStudents
  };
};

const Gym = mongoose.model('Gym', gymSchema);

module.exports = Gym; 