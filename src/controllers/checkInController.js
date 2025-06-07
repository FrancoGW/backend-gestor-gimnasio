const checkInService = require('../services/checkInService');
const CheckIn = require('../models/CheckIn');
const Student = require('../models/Student');
const Gym = require('../models/Gym');

class CheckInController {
  async registerCheckIn(req, res, next) {
    try {
      const { dni, qrCode, checkInMethod, location } = req.body;
      const gymId = req.user.gymId;

      let student;

      // Buscar estudiante según el método de check-in
      if (checkInMethod === 'dni') {
        student = await Student.findOne({ gymId, dni });
      } else if (checkInMethod === 'qr') {
        student = await Student.findOne({ gymId, qrCode });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Método de check-in inválido',
          code: 'INVALID_CHECKIN_METHOD'
        });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verificar si la membresía está activa
      if (student.membershipStatus !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'La membresía del estudiante no está activa',
          code: 'INACTIVE_MEMBERSHIP'
        });
      }

      // Verificar si ya hay un check-in hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCheckIn = await CheckIn.findOne({
        studentId: student._id,
        timestamp: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (existingCheckIn) {
        return res.status(400).json({
          success: false,
          message: 'El estudiante ya tiene un check-in registrado hoy',
          code: 'DUPLICATE_CHECKIN'
        });
      }

      // Crear check-in
      const checkIn = new CheckIn({
        studentId: student._id,
        gymId,
        checkInMethod,
        location
      });

      await checkIn.save();

      // Actualizar último check-in y contador del estudiante
      student.lastCheckIn = new Date();
      student.totalCheckIns += 1;
      await student.save();

      // Actualizar estadísticas del gimnasio
      await Gym.findByIdAndUpdate(gymId, {
        $inc: { 'stats.totalCheckIns': 1 }
      });

      res.status(201).json({
        success: true,
        data: {
          checkIn,
          student: {
            id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            dni: student.dni,
            membershipStatus: student.membershipStatus,
            membershipExpiryDate: student.membershipExpiryDate
          }
        },
        message: 'Check-in registrado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async getCheckIn(req, res, next) {
    try {
      const { id } = req.params;
      const checkIn = await checkInService.getCheckIn(id);
      res.json(checkIn);
    } catch (error) {
      next(error);
    }
  }

  async listCheckIns(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await checkInService.listCheckIns(req.user.gymId, filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStudentCheckIns(req, res, next) {
    try {
      const { studentId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await checkInService.getStudentCheckIns(studentId, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCheckInStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await checkInService.getCheckInStats(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getActiveStudents(req, res, next) {
    try {
      const students = await checkInService.getActiveStudents(req.user.gymId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getPeakHours(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const peakHours = await checkInService.getPeakHours(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(peakHours);
    } catch (error) {
      next(error);
    }
  }

  async getCheckIns(req, res, next) {
    try {
      const { today, page = 1, limit = 10 } = req.query;
      const gymId = req.user.gymId;

      const query = { gymId };

      // Filtrar por fecha si se solicita
      if (today === 'true') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        query.timestamp = {
          $gte: today,
          $lt: tomorrow
        };
      }

      const checkIns = await CheckIn.find(query)
        .populate('studentId', 'firstName lastName dni')
        .sort('-timestamp')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await CheckIn.countDocuments(query);

      res.json({
        success: true,
        data: {
          checkIns,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCheckInById(req, res, next) {
    try {
      const checkIn = await CheckIn.findById(req.params.id)
        .populate('studentId', 'firstName lastName dni');

      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in no encontrado',
          code: 'CHECKIN_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (checkIn.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este check-in',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        data: {
          checkIn
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CheckInController(); 