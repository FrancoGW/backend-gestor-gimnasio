const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  maxStudents: {
    type: Number,
    default: null // null significa ilimitado
  },
  features: {
    qrAccess: {
      type: Boolean,
      default: false
    },
    cameraAccess: {
      type: Boolean,
      default: false
    },
    advancedReports: {
      type: Boolean,
      default: false
    },
    emailTemplates: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
planSchema.index({ isActive: 1, sortOrder: 1 });

// Método para obtener planes activos ordenados
planSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, price: 1 })
    .lean();
};

// Método para verificar si un plan tiene una característica específica
planSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Método para obtener el precio formateado
planSchema.methods.getFormattedPrice = function(currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency
  }).format(this.price);
};

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan; 