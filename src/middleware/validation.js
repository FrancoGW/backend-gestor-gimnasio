const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        throw new ValidationError('Error de validación', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Schemas de validación
const schemas = {
  // Auth
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string(),
    role: Joi.string().valid('gym_owner', 'client').required()
  }),

  // Gym
  createGym: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    settings: Joi.object({
      timezone: Joi.string(),
      currency: Joi.string(),
      notifications: Joi.object({
        emailEnabled: Joi.boolean(),
        smsEnabled: Joi.boolean(),
        reminderDays: Joi.number().min(1)
      })
    })
  }),

  updateGym: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    settings: Joi.object({
      timezone: Joi.string(),
      currency: Joi.string(),
      notifications: Joi.object({
        emailEnabled: Joi.boolean(),
        smsEnabled: Joi.boolean(),
        reminderDays: Joi.number().min(1)
      })
    })
  }),

  // Student
  createStudent: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dni: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    membership: Joi.object({
      planId: Joi.string().required(),
      startDate: Joi.date().required(),
      price: Joi.number().min(0).required()
    })
  }),

  updateStudent: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string(),
    membership: Joi.object({
      planId: Joi.string(),
      startDate: Joi.date(),
      price: Joi.number().min(0)
    })
  }),

  // Membership Plan
  createMembershipPlan: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    price: Joi.number().min(0).required(),
    duration: Joi.number().min(1).required(),
    durationType: Joi.string().valid('days', 'months').required(),
    hasQR: Joi.boolean(),
    benefits: Joi.array().items(Joi.string())
  }),

  updateMembershipPlan: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    price: Joi.number().min(0),
    duration: Joi.number().min(1),
    durationType: Joi.string().valid('days', 'months'),
    hasQR: Joi.boolean(),
    benefits: Joi.array().items(Joi.string())
  }),

  // Check-in
  checkIn: Joi.object({
    method: Joi.string().valid('dni', 'qr', 'camera').required(),
    location: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    }),
    notes: Joi.string()
  }),

  // Email Template
  createEmailTemplate: Joi.object({
    name: Joi.string().required(),
    subject: Joi.string().required(),
    content: Joi.string().required(),
    type: Joi.string().valid('welcome', 'payment_reminder', 'membership_expiry', 'promotion', 'qr_card', 'general').required(),
    variables: Joi.array().items(Joi.string()),
    settings: Joi.object({
      isActive: Joi.boolean(),
      autoSend: Joi.boolean(),
      triggerDays: Joi.number().min(1)
    })
  }),

  updateEmailTemplate: Joi.object({
    name: Joi.string(),
    subject: Joi.string(),
    content: Joi.string(),
    type: Joi.string().valid('welcome', 'payment_reminder', 'membership_expiry', 'promotion', 'qr_card', 'general'),
    variables: Joi.array().items(Joi.string()),
    settings: Joi.object({
      isActive: Joi.boolean(),
      autoSend: Joi.boolean(),
      triggerDays: Joi.number().min(1)
    })
  }),

  // Notification
  createNotification: Joi.object({
    type: Joi.string().valid('payment_reminder', 'membership_expiry', 'welcome', 'qr_card', 'general').required(),
    channel: Joi.string().valid('email', 'sms', 'push').required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    templateId: Joi.string(),
    scheduledFor: Joi.date(),
    metadata: Joi.object({
      recipientEmail: Joi.string().email(),
      recipientPhone: Joi.string(),
      attachments: Joi.array().items(Joi.string())
    })
  })
};

module.exports = {
  validate,
  schemas
}; 