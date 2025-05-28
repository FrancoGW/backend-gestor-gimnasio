const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email enviado:', info.messageId);
      return info;
    } catch (error) {
      logger.error('Error al enviar email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(student, gym) {
    const subject = `¡Bienvenido a ${gym.name}!`;
    const html = `
      <h1>¡Bienvenido a ${gym.name}!</h1>
      <p>Hola ${student.firstName},</p>
      <p>Gracias por unirte a nuestro gimnasio. Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
      <p>Tu membresía está activa desde ${new Date(student.membership.startDate).toLocaleDateString()} hasta ${new Date(student.membership.expiryDate).toLocaleDateString()}.</p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>Saludos,<br>El equipo de ${gym.name}</p>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html
    });
  }

  async sendMembershipExpiryReminder(student, gym, daysUntilExpiry) {
    const subject = `Tu membresía en ${gym.name} está por vencer`;
    const html = `
      <h1>Recordatorio de membresía</h1>
      <p>Hola ${student.firstName},</p>
      <p>Te informamos que tu membresía en ${gym.name} vencerá en ${daysUntilExpiry} días.</p>
      <p>Para continuar disfrutando de nuestros servicios, por favor renueva tu membresía antes de la fecha de vencimiento.</p>
      <p>Fecha de vencimiento: ${new Date(student.membership.expiryDate).toLocaleDateString()}</p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>Saludos,<br>El equipo de ${gym.name}</p>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html
    });
  }

  async sendPaymentReminder(student, gym, dueDate) {
    const subject = `Recordatorio de pago - ${gym.name}`;
    const html = `
      <h1>Recordatorio de pago</h1>
      <p>Hola ${student.firstName},</p>
      <p>Te recordamos que tienes un pago pendiente en ${gym.name}.</p>
      <p>Fecha de vencimiento: ${new Date(dueDate).toLocaleDateString()}</p>
      <p>Monto a pagar: ${student.membership.price}</p>
      <p>Por favor, realiza el pago antes de la fecha de vencimiento para evitar la suspensión de tu membresía.</p>
      <p>Si ya realizaste el pago, por favor ignora este mensaje.</p>
      <p>Saludos,<br>El equipo de ${gym.name}</p>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html
    });
  }

  async sendQrCard(student, gym, qrCodeUrl) {
    const subject = `Tu tarjeta QR - ${gym.name}`;
    const html = `
      <h1>Tu tarjeta QR</h1>
      <p>Hola ${student.firstName},</p>
      <p>Adjunto encontrarás tu tarjeta QR para acceder a ${gym.name}.</p>
      <p>Por favor, mantén esta tarjeta segura y preséntala al ingresar al gimnasio.</p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>Saludos,<br>El equipo de ${gym.name}</p>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html,
      attachments: [{
        filename: 'qr-card.png',
        path: qrCodeUrl
      }]
    });
  }

  async sendCustomEmail(template, data) {
    const { subject, content } = template.replaceVariables(data);
    
    return this.sendEmail({
      to: data.recipientEmail,
      subject,
      html: content,
      attachments: data.attachments
    });
  }
}

module.exports = new EmailService(); 