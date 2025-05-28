const mongoose = require('mongoose');
const QRCode = require('qrcode');

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
    sparse: true
  },
  membership: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    lastPayment: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
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

// Índices
studentSchema.index({ gymId: 1, dni: 1 }, { unique: true });
studentSchema.index({ qrCode: 1 }, { unique: true, sparse: true });
studentSchema.index({ gymId: 1, 'membership.status': 1 });
studentSchema.index({ gymId: 1, 'membership.expiryDate': 1 });
studentSchema.index({ gymId: 1, isActive: 1 });

// Método para generar QR Code
studentSchema.methods.generateQRCode = async function() {
  const data = {
    studentId: this._id.toString(),
    gymId: this.gymId.toString(),
    dni: this.dni
  };

  try {
    const qrCode = await QRCode.toDataURL(JSON.stringify(data));
    this.qrCode = qrCode;
    return this.save();
  } catch (error) {
    throw new Error('Error generating QR code');
  }
};

// Método para verificar si la membresía está activa
studentSchema.methods.isMembershipActive = function() {
  return this.membership.status === 'active' && 
         this.membership.expiryDate > new Date();
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
  
  if (this.membership.expiryDate < now) {
    this.membership.status = 'expired';
  } else if (this.membership.status === 'expired') {
    this.membership.status = 'active';
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