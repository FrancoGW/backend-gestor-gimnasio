const mongoose = require('mongoose');
const crypto = require('crypto');

const studentSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dni: {
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  photo: String,
  qrCode: {
    type: String,
    unique: true
  },
  membershipPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipExpiryDate: {
    type: Date,
    required: true
  },
  lastPayment: Date,
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastCheckIn: Date,
  totalCheckIns: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices compuestos
studentSchema.index({ gymId: 1, dni: 1 }, { unique: true });
studentSchema.index({ gymId: 1, qrCode: 1 }, { unique: true });

// Método para generar QR único
studentSchema.pre('save', async function(next) {
  if (!this.qrCode) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    this.qrCode = `GYM_${this.gymId}_STU_${timestamp}_${random}`;
  }
  next();
});

// Método para calcular fecha de expiración
studentSchema.methods.calculateExpiryDate = async function() {
  const MembershipPlan = mongoose.model('MembershipPlan');
  const plan = await MembershipPlan.findById(this.membershipPlanId);
  
  if (!plan) {
    throw new Error('Plan de membresía no encontrado');
  }

  const expiryDate = new Date(this.membershipStartDate);
  if (plan.durationType === 'days') {
    expiryDate.setDate(expiryDate.getDate() + plan.duration);
  } else if (plan.durationType === 'months') {
    expiryDate.setMonth(expiryDate.getMonth() + plan.duration);
  }

  this.membershipExpiryDate = expiryDate;
  return this.save();
};

// Método para verificar si la membresía está activa
studentSchema.methods.isMembershipActive = function() {
  return this.membershipStatus === 'active' && 
         this.membershipExpiryDate > new Date();
};

// Método para registrar check-in
studentSchema.methods.registerCheckIn = async function() {
  this.lastCheckIn = new Date();
  this.totalCheckIns += 1;
  return this.save();
};

// Método para actualizar estado de membresía
studentSchema.methods.updateMembershipStatus = async function() {
  const now = new Date();
  
  if (this.membershipExpiryDate < now) {
    this.membershipStatus = 'expired';
  } else if (this.membershipStatus === 'expired') {
    this.membershipStatus = 'active';
  }
  
  return this.save();
};

// Método para obtener datos públicos del estudiante
studentSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.qrCode; // No exponer el QR code en respuestas públicas
  return obj;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 