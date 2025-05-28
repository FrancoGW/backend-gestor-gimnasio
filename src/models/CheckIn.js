const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  checkInMethod: {
    type: String,
    enum: ['dni', 'qr', 'camera'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  notes: String
}, {
  timestamps: true
});

// Índices
checkInSchema.index({ gymId: 1, timestamp: -1 });
checkInSchema.index({ studentId: 1, timestamp: -1 });
checkInSchema.index({ gymId: 1, timestamp: 1 });
checkInSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 días

// Método para obtener check-ins de un estudiante
checkInSchema.statics.getStudentCheckIns = function(studentId, options = {}) {
  const query = this.find({ studentId })
    .sort({ timestamp: -1 });

  if (options.limit) {
    query.limit(options.limit);
  }

  if (options.skip) {
    query.skip(options.skip);
  }

  return query;
};

// Método para obtener check-ins de un gimnasio en un rango de fechas
checkInSchema.statics.getGymCheckInsByDateRange = function(gymId, startDate, endDate) {
  return this.find({
    gymId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

// Método para obtener estadísticas de check-ins por método
checkInSchema.statics.getCheckInStatsByMethod = async function(gymId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        gymId: mongoose.Types.ObjectId(gymId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$checkInMethod',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Método para obtener check-ins por hora del día
checkInSchema.statics.getCheckInsByHour = async function(gymId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        gymId: mongoose.Types.ObjectId(gymId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn; 