const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  type: {
    type: String,
    enum: ['payment_reminder', 'membership_expiry', 'welcome', 'qr_card', 'general'],
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  scheduledFor: Date,
  sentAt: Date,
  failureReason: String,
  metadata: {
    recipientEmail: String,
    recipientPhone: String,
    attachments: [String]
  }
}, {
  timestamps: true
});

// Índices
notificationSchema.index({ gymId: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ studentId: 1, createdAt: -1 });

// Método para marcar como enviada
notificationSchema.methods.markAsSent = async function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Método para marcar como fallida
notificationSchema.methods.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Método para cancelar
notificationSchema.methods.cancel = async function() {
  if (this.status === 'pending') {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('Solo se pueden cancelar notificaciones pendientes');
};

// Método para reprogramar
notificationSchema.methods.reschedule = async function(newDate) {
  if (this.status === 'failed' || this.status === 'cancelled') {
    this.status = 'pending';
    this.scheduledFor = newDate;
    this.failureReason = null;
    return this.save();
  }
  throw new Error('Solo se pueden reprogramar notificaciones fallidas o canceladas');
};

// Método para obtener notificaciones pendientes
notificationSchema.statics.getPendingNotifications = function() {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() }
  }).sort({ scheduledFor: 1 });
};

// Método para obtener notificaciones de un estudiante
notificationSchema.statics.getStudentNotifications = function(studentId, options = {}) {
  const query = this.find({ studentId })
    .sort({ createdAt: -1 });

  if (options.limit) {
    query.limit(options.limit);
  }

  if (options.skip) {
    query.skip(options.skip);
  }

  return query;
};

// Método para obtener estadísticas de notificaciones
notificationSchema.statics.getNotificationStats = async function(gymId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        gymId: mongoose.Types.ObjectId(gymId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status',
          channel: '$channel'
        },
        count: { $sum: 1 }
      }
    }
  ]);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 