const CheckIn = require('../models/CheckIn');
const Student = require('../models/Student');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class CheckInService {
  async registerCheckIn(checkInData) {
    try {
      const student = await Student.findById(checkInData.studentId);
      if (!student) {
        throw new NotFoundError('Estudiante no encontrado');
      }

      // Verificar membresía
      if (student.membership.status !== 'active') {
        throw new ValidationError('La membresía del estudiante no está activa');
      }

      // Verificar si ya hay un check-in hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCheckIn = await CheckIn.findOne({
        studentId: checkInData.studentId,
        checkInTime: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (existingCheckIn) {
        throw new ValidationError('El estudiante ya tiene un check-in registrado hoy');
      }

      // Crear check-in
      const checkIn = new CheckIn({
        ...checkInData,
        gymId: student.gymId
      });

      await checkIn.save();
      logger.info(`Check-in registrado para estudiante: ${student.firstName} ${student.lastName}`);

      return checkIn;
    } catch (error) {
      logger.error('Error al registrar check-in:', error);
      throw error;
    }
  }

  async getCheckIn(checkInId) {
    try {
      const checkIn = await CheckIn.findById(checkInId);
      if (!checkIn) {
        throw new NotFoundError('Check-in no encontrado');
      }
      return checkIn;
    } catch (error) {
      logger.error('Error al obtener check-in:', error);
      throw error;
    }
  }

  async listCheckIns(gymId, filters = {}, page = 1, limit = 10) {
    try {
      const query = CheckIn.find({ gymId, ...filters })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ checkInTime: -1 })
        .populate('studentId', 'firstName lastName email');

      const [checkIns, total] = await Promise.all([
        query.exec(),
        CheckIn.countDocuments({ gymId, ...filters })
      ]);

      return {
        checkIns,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error al listar check-ins:', error);
      throw error;
    }
  }

  async getStudentCheckIns(studentId, page = 1, limit = 10) {
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
      logger.error('Error al obtener check-ins del estudiante:', error);
      throw error;
    }
  }

  async getCheckInStats(gymId, startDate, endDate) {
    try {
      const stats = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            checkInTime: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              method: '$checkInMethod',
              hour: { $hour: '$checkInTime' },
              day: { $dayOfWeek: '$checkInTime' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      return this.formatCheckInStats(stats);
    } catch (error) {
      logger.error('Error al obtener estadísticas de check-ins:', error);
      throw error;
    }
  }

  formatCheckInStats(stats) {
    const formatted = {
      byMethod: {},
      byHour: {},
      byDay: {}
    };

    stats.forEach(stat => {
      const { method, hour, day } = stat._id;

      // Estadísticas por método
      if (!formatted.byMethod[method]) {
        formatted.byMethod[method] = 0;
      }
      formatted.byMethod[method] += stat.count;

      // Estadísticas por hora
      if (!formatted.byHour[hour]) {
        formatted.byHour[hour] = 0;
      }
      formatted.byHour[hour] += stat.count;

      // Estadísticas por día
      if (!formatted.byDay[day]) {
        formatted.byDay[day] = 0;
      }
      formatted.byDay[day] += stat.count;
    });

    return formatted;
  }

  async getActiveStudents(gymId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeStudents = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            checkInTime: {
              $gte: today,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: '$studentId',
            lastCheckIn: { $max: '$checkInTime' }
          }
        }
      ]);

      const studentIds = activeStudents.map(s => s._id);
      const students = await Student.find({ _id: { $in: studentIds } });

      return students.map(student => ({
        ...student.toObject(),
        lastCheckIn: activeStudents.find(s => s._id.toString() === student._id.toString()).lastCheckIn
      }));
    } catch (error) {
      logger.error('Error al obtener estudiantes activos:', error);
      throw error;
    }
  }

  async getPeakHours(gymId, startDate, endDate) {
    try {
      const stats = await CheckIn.aggregate([
        {
          $match: {
            gymId,
            checkInTime: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: { $hour: '$checkInTime' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return stats.map(stat => ({
        hour: stat._id,
        count: stat.count
      }));
    } catch (error) {
      logger.error('Error al obtener horas pico:', error);
      throw error;
    }
  }
}

module.exports = new CheckInService(); 