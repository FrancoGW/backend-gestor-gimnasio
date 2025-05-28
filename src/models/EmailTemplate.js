const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['welcome', 'payment_reminder', 'membership_expiry', 'promotion', 'qr_card', 'general'],
    required: true
  },
  variables: [{
    type: String,
    trim: true
  }],
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    autoSend: {
      type: Boolean,
      default: false
    },
    triggerDays: {
      type: Number,
      min: 1
    }
  },
  usage: {
    count: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    successRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Índices
emailTemplateSchema.index({ gymId: 1, type: 1 });
emailTemplateSchema.index({ gymId: 1, 'settings.isActive': 1 });

// Método para validar variables en el contenido
emailTemplateSchema.methods.validateVariables = function() {
  const variableRegex = /{{([^}]+)}}/g;
  const foundVariables = [];
  let match;

  while ((match = variableRegex.exec(this.content)) !== null) {
    foundVariables.push(match[1].trim());
  }

  // Verificar que todas las variables encontradas estén en la lista de variables permitidas
  const invalidVariables = foundVariables.filter(v => !this.variables.includes(v));
  
  if (invalidVariables.length > 0) {
    throw new Error(`Variables inválidas encontradas: ${invalidVariables.join(', ')}`);
  }

  return true;
};

// Método para reemplazar variables en el contenido
emailTemplateSchema.methods.replaceVariables = function(data) {
  let content = this.content;
  let subject = this.subject;

  this.variables.forEach(variable => {
    const value = data[variable] || '';
    const regex = new RegExp(`{{${variable}}}`, 'g');
    content = content.replace(regex, value);
    subject = subject.replace(regex, value);
  });

  return { content, subject };
};

// Método para actualizar estadísticas de uso
emailTemplateSchema.methods.updateUsageStats = async function(success) {
  this.usage.count += 1;
  this.usage.lastUsed = new Date();
  
  // Actualizar tasa de éxito
  const total = this.usage.count;
  const currentSuccess = Math.round((this.usage.successRate * (total - 1)) / 100);
  const newSuccess = currentSuccess + (success ? 1 : 0);
  this.usage.successRate = Math.round((newSuccess / total) * 100);
  
  return this.save();
};

// Método para duplicar una plantilla
emailTemplateSchema.methods.duplicate = async function() {
  const duplicate = new this.constructor({
    gymId: this.gymId,
    name: `${this.name} (copia)`,
    subject: this.subject,
    content: this.content,
    type: this.type,
    variables: this.variables,
    settings: {
      isActive: false,
      autoSend: false
    }
  });

  return duplicate.save();
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate; 