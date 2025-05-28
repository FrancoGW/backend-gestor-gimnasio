const Student = require('../models/Student');
const Gym = require('../models/Gym');
const MembershipPlan = require('../models/MembershipPlan');
const CheckIn = require('../models/CheckIn');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const emailService = require('./emailService');
const notificationService = require('./notificationService');

class StudentService {
  async createStudent(studentData) {
    try {
      // Verificar límites del gimnasio
      const gym = await Gym.findById(studentData.gymId).populate('planId');
      if (!gym) {
        throw new NotFoundError('Gimnasio no encontrado');
      }

      const studentCount = await Student.countDocuments({ gymId: studentData.gymId });
      if (studentCount >= gym.planId.maxStudents) {
        throw new ValidationError('El gimnasio ha alcanzado el límite de estudiantes');
      }

      // Crear estudiante
      const student = new Student(studentData);
      await student.save();

      // Enviar email de bienvenida
      await emailService.sendWelcomeEmail(student, gym);

      logger.info(`Estudiante creado: ${student.firstName} ${student.lastName}`);
      return student;
    } catch (error) {
      logger.error('Error al crear estudiante:', error);
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }

      Object.assign(student, updateData);
      await student.save();
      logger.info(`Estudiante actualizado: ${student.firstName} ${student.lastName}`);
      return student;
    } catch (error) {
      logger.error('Error al actualizar estudiante:', error);
      throw error;
    }
  }

  async deleteStudent(studentId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }

      await student.remove();
      logger.info(`Estudiante eliminado: ${student.firstName} ${student.lastName}`);
      return { message: 'Estudiante eliminado exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar estudiante:', error);
      throw error;
    }
  }

  async getStudent(studentId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }
      return student;
    } catch (error) {
      logger.error('Error al obtener estudiante:', error);
      throw error;
    }
  }

  async listStudents(gymId, filters = {}, page = 1, limit = 10) {
    try {
      const query = Student.find({ gymId, ...filters })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const [students, total] = await Promise.all([
        query.exec(),
        Student.countDocuments({ gymId, ...filters })
      ]);

      return {
        students,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error al listar estudiantes:', error);
      throw error;
    }
  }

  async updateMembership(studentId, membershipData) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }

      // Verificar plan de membresía
      const membershipPlan = await MembershipPlan.findById(membershipData.planId);
      if (!membershipPlan) {
        throw new NotFoundError('Plan de membresía no encontrado');
      }

      // Actualizar membresía
      student.membership = {
        ...membershipData,
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + membershipPlan.duration * 24 * 60 * 60 * 1000)
      };

      await student.save();
      logger.info(`Membresía actualizada para estudiante: ${student.firstName} ${student.lastName}`);

      // Programar notificación de vencimiento
      await this.scheduleExpiryNotification(student);

      return student;
    } catch (error) {
      logger.error('Error al actualizar membresía:', error);
      throw error;
    }
  }

  async checkIn(studentId, method) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }

      // Verificar membresía
      if (student.membership.status !== 'active') {
        throw new ValidationError('La membresía del estudiante no está activa');
      }

      // Crear check-in
      const checkIn = new CheckIn({
        studentId,
        gymId: student.gymId,
        checkInMethod: method
      });

      await checkIn.save();
      logger.info(`Check-in registrado para estudiante: ${student.firstName} ${student.lastName}`);

      return checkIn;
    } catch (error) {
      logger.error('Error al registrar check-in:', error);
      throw error;
    }
  }

  async getCheckInHistory(studentId, page = 1, limit = 10) {
    try {
      const query = CheckIn.find({ studentId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ checkInTime: -1 });

      const [checkIns, total] = await Promise.all([
        query.exec(),
        CheckIn.countDocuments({ studentId })
      ]);

      return {
        checkIns,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error al obtener historial de check-ins:', error);
      throw error;
    }
  }

  async scheduleExpiryNotification(student) {
    try {
      const daysUntilExpiry = 7; // Notificar 7 días antes
      const notificationDate = new Date(student.membership.expiryDate);
      notificationDate.setDate(notificationDate.getDate() - daysUntilExpiry);

      await notificationService.createNotification({
        gymId: student.gymId,
        studentId: student._id,
        type: 'membership_expiry',
        channel: 'email',
        title: 'Tu membresía está por vencer',
        message: `Tu membresía vencerá en ${daysUntilExpiry} días`,
        scheduledFor: notificationDate
      });

      logger.info(`Notificación de vencimiento programada para estudiante: ${student.firstName} ${student.lastName}`);
    } catch (error) {
      logger.error('Error al programar notificación de vencimiento:', error);
      throw error;
    }
  }

  async processExpiredMemberships() {
    try {
      const expiredStudents = await Student.find({
        'membership.status': 'active',
        'membership.expiryDate': { $lt: new Date() }
      });

      for (const student of expiredStudents) {
        student.membership.status = 'expired';
        await student.save();
        logger.info(`Membresía expirada para estudiante: ${student.firstName} ${student.lastName}`);
      }

      return expiredStudents.length;
    } catch (error) {
      logger.error('Error al procesar membresías expiradas:', error);
      throw error;
    }
  }
}

module.exports = new StudentService(); 