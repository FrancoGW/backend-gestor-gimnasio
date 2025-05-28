const Notification = require('../models/Notification');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      return notification;
    } catch (error) {
      logger.error('Error al crear notificación:', error);
      throw error;
    }
  }

  async sendNotification(notification) {
    try {
      switch (notification.channel) {
        case 'email':
          await this.sendEmailNotification(notification);
          break;
        case 'sms':
          await this.sendSmsNotification(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        default:
          throw new Error(`Canal de notificación no soportado: ${notification.channel}`);
      }

      await notification.markAsSent();
      return notification;
    } catch (error) {
      await notification.markAsFailed(error.message);
      logger.error('Error al enviar notificación:', error);
      throw error;
    }
  }

  async sendEmailNotification(notification) {
    const { studentId, title, message, templateId } = notification;
    
    if (templateId) {
      // Si hay una plantilla, usar el servicio de email con la plantilla
      await emailService.sendCustomEmail(templateId, {
        recipientEmail: studentId.email,
        subject: title,
        content: message
      });
    } else {
      // Si no hay plantilla, enviar email directo
      await emailService.sendEmail({
        to: studentId.email,
        subject: title,
        html: message
      });
    }
  }

  async sendSmsNotification(notification) {
    // TODO: Implementar integración con servicio de SMS
    logger.info('Enviando SMS:', notification);
  }

  async sendPushNotification(notification) {
    // TODO: Implementar integración con servicio de push notifications
    logger.info('Enviando push notification:', notification);
  }

  async processScheduledNotifications() {
    try {
      const pendingNotifications = await Notification.findPending();
      
      for (const notification of pendingNotifications) {
        if (notification.scheduledFor <= new Date()) {
          await this.sendNotification(notification);
        }
      }
    } catch (error) {
      logger.error('Error al procesar notificaciones programadas:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      await notification.cancel();
      return notification;
    } catch (error) {
      logger.error('Error al cancelar notificación:', error);
      throw error;
    }
  }

  async rescheduleNotification(notificationId, newDate) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      await notification.reschedule(newDate);
      return notification;
    } catch (error) {
      logger.error('Error al reprogramar notificación:', error);
      throw error;
    }
  }

  async getNotificationStats(gymId) {
    try {
      return await Notification.getStats(gymId);
    } catch (error) {
      logger.error('Error al obtener estadísticas de notificaciones:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 