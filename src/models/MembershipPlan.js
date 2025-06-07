const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  durationType: {
    type: String,
    enum: ['days', 'months'],
    required: true
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  studentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
membershipPlanSchema.index({ gymId: 1, name: 1 }, { unique: true });
membershipPlanSchema.index({ gymId: 1, isActive: 1 });

// Método para calcular la fecha de expiración
membershipPlanSchema.methods.calculateExpiryDate = function(startDate) {
  const date = new Date(startDate);
  
  if (this.durationType === 'months') {
    date.setMonth(date.getMonth() + this.duration);
  } else {
    date.setDate(date.getDate() + this.duration);
  }
  
  return date;
};

// Método para obtener el precio formateado
membershipPlanSchema.methods.getFormattedPrice = function(currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency
  }).format(this.price);
};

// Método para incrementar el contador de estudiantes
membershipPlanSchema.methods.incrementStudentsCount = async function() {
  this.studentsCount += 1;
  return this.save();
};

// Método para decrementar el contador de estudiantes
membershipPlanSchema.methods.decrementStudentsCount = async function() {
  if (this.studentsCount > 0) {
    this.studentsCount -= 1;
    return this.save();
  }
  return this;
};

// Método para obtener planes activos de un gimnasio
membershipPlanSchema.statics.getActivePlans = function(gymId) {
  return this.find({
    gymId,
    isActive: true
  }).sort({ price: 1 });
};

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);

module.exports = MembershipPlan; 